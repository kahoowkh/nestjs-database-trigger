import { DynamicModule, Global, Module, OnModuleDestroy } from "@nestjs/common";
import { EventEmitter } from "events";
import { DiscoveryModule } from "@nestjs/core";
import { TriggerService } from "./trigger.service";
import { ConnectAsyncOptions, ConnectOptions } from "./interfaces";
import { TriggerAccessor } from "./trigger.accessor";
import { Driver } from "./drivers/driver";
import { PGDriver } from "./drivers/pg";

@Global()
@Module({})
export class TriggerModule implements OnModuleDestroy {
  private static driver: Driver;

  private static initDriver(
    args: Pick<ConnectOptions, "client" | "connectionString">,
  ) {
    switch (args.client) {
      case "pg":
        this.driver = new PGDriver(args.connectionString);
        break;
      default:
        throw new Error(`No client: ${args.client}`);
    }
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
            const { client, connectionString, tables } =
              await connectAsyncOptions.useFactory(...args);

            this.initDriver({ client, connectionString });
            return this.driver.createTriggerEvents(tables, eventEmitter);
          },
        },
      ],
      exports: [TriggerService],
    };
  }

  async onModuleDestroy() {
    await TriggerModule.driver.endConnection();
  }
}
