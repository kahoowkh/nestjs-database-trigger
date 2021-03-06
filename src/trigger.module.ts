import { DynamicModule, Global, Module, OnModuleDestroy } from "@nestjs/common";
import { EventEmitter } from "events";
import { Client, Notification, Pool } from "pg";
import { DiscoveryModule } from "@nestjs/core";
import { TriggerService } from "./trigger.service";
import { ConnectAsyncOptions, MessagePayload } from "./interfaces";
import { TriggerAccessor } from "./trigger.accessor";

@Global()
@Module({})
export class TriggerModule implements OnModuleDestroy {
  protected static pg: Client;

  protected static get functionStatement() {
    return `
        CREATE OR REPLACE FUNCTION public.change_data_capture()
          RETURNS trigger
          LANGUAGE plpgsql
        AS $function$
        DECLARE
           response json;
        BEGIN
            response = json_build_object('table',TG_TABLE_NAME, 'action', TG_OP, 'data', NEW, 'oldData', OLD);
            PERFORM pg_notify('cdc_event', response::text);
            RETURN NULL;
        END;
        $function$;
    `;
  }

  protected static triggerStatement(table: string) {
    return `
          DROP TRIGGER IF EXISTS notify_Notification ON "${table}";

          CREATE TRIGGER notify_Notification
          AFTER INSERT OR UPDATE OR DELETE
          ON "${table}"
          FOR EACH ROW EXECUTE PROCEDURE change_data_capture();
    `;
  }

  protected static async databaseAction(
    connection: string,
    tables: string[],
    eventEmitter: EventEmitter,
  ): Promise<{ [key: string]: string }> {
    this.pg = new Client(connection);
    await this.pg.connect();

    await this.pg.query(this.functionStatement).catch((e) => {
      console.error(e);
    });

    const eventName: { [key: string]: string } = {};

    for (const table of tables) {
      eventName[table] = `notify_${table}`;

      await this.pg.query(this.triggerStatement(table)).catch((e) => {
        console.error(e);
      });
    }

    await this.pg.query("Listen cdc_event").catch((e) => {
      console.error(e);
    });

    this.pg.on("notification", (message: Notification) => {
      try {
        if (!message.payload) return;
        const payload: MessagePayload = JSON.parse(message.payload);
        eventEmitter.emit(eventName[payload.table], payload);
      } catch (e) {
        console.error(e);
      }
    });

    return eventName;
  }

  static forRootAsync(connectAsyncOptions: ConnectAsyncOptions): DynamicModule {
    const eventEmitter = new EventEmitter();
    const imports = connectAsyncOptions.imports || [];

    return {
      imports: [...imports, DiscoveryModule],
      module: TriggerModule,
      providers: [
        TriggerService,
        TriggerAccessor,
        {
          provide: "EventEmitter",
          useValue: eventEmitter,
        },
        {
          inject: connectAsyncOptions.inject,
          provide: "EventNameObject",
          useFactory: async (...args) => {
            const connectOptions = await connectAsyncOptions.useFactory(
              ...args,
            );
            return this.databaseAction(
              connectOptions.connectionString,
              connectOptions.tables,
              eventEmitter,
            );
          },
        },
      ],
      exports: [TriggerService],
    };
  }

  async onModuleDestroy() {
    await TriggerModule.pg.end();
  }
}
