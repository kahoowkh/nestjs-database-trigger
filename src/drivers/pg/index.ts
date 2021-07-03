import { EventEmitter } from "events";
import { Client, Notification } from "pg";
import { MessagePayload } from "../../interfaces";
import { Driver } from "../driver";

export class PGDriver extends Driver {
  private pg: Client;

  constructor(connection: string) {
    super();
    this.pg = new Client(connection);
  }

  private get functionStatement() {
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

  private triggerStatement(table: string) {
    return `
          DROP TRIGGER IF EXISTS notify_Notification ON "${table}";

          CREATE TRIGGER notify_Notification
          AFTER INSERT OR UPDATE OR DELETE
          ON "${table}"
          FOR EACH ROW EXECUTE PROCEDURE change_data_capture();
    `;
  }

  async createTriggerEvents(
    tables: string[],
    eventEmitter: EventEmitter,
  ): Promise<Record<string, string>> {
    await this.pg.connect();
    await this.pg.query(this.functionStatement).catch((e) => {
      console.error(e);
    });

    const eventName: Record<string, string> = {};

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

  async endConnection() {
    return this.pg.end();
  }
}
