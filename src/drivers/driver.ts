import EventEmitter from "events";

export abstract class Driver {
  abstract createTriggerEvents(
    tables: string[],
    eventEmitter: EventEmitter,
  ): Promise<Record<string, string>>;

  abstract endConnection(): Promise<void>;
}
