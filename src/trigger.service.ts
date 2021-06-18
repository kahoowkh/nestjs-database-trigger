import { Inject, Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { EventEmitter } from "events";
import { DiscoveryService, MetadataScanner } from "@nestjs/core";
import { InstanceWrapper } from "@nestjs/core/injector/instance-wrapper";
import { MessagePayload } from "./interfaces";
import { TriggerAccessor } from "./trigger.accessor";

@Injectable()
export class TriggerService implements OnApplicationBootstrap {
  // eslint-disable-next-line no-useless-constructor
  constructor(
    @Inject("EventEmitter") private readonly eventEmitter: EventEmitter,
    @Inject("EventNameObject")
    private readonly eventNameObject: { [key: string]: string },
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly triggerAccessor: TriggerAccessor, // eslint-disable-next-line no-empty-function
  ) {}

  onApplicationBootstrap() {
    this.loadEventListeners();
  }

  private loadEventListeners() {
    // get all instances
    const providers = this.discoveryService.getProviders();
    const controllers = this.discoveryService.getControllers();
    [...providers, ...controllers]
      .filter((wrapper) => wrapper.isDependencyTreeStatic())
      .filter((wrapper) => wrapper.instance)
      .forEach((wrapper: InstanceWrapper) => {
        const { instance } = wrapper;
        const prototype = Object.getPrototypeOf(instance);
        this.metadataScanner.scanFromPrototype(instance, prototype, (methodKey: string) => {
          return this.subscribeToEventIfListener(instance, methodKey);
        });
      });
  }

  private subscribeToEventIfListener(instance: Record<string, any>, methodKey: string) {
    const eventListenerMetadata = this.triggerAccessor.getEventHandlerMetadata(
      instance[methodKey],
    );
    if (!eventListenerMetadata) {
      return;
    }
    const { tableName } = eventListenerMetadata;
    this.subscribe(tableName, (...args: unknown[]) => instance[methodKey].call(instance, ...args));
  }

  private getEventName(table: string) {
    return this.eventNameObject[table];
  }

  subscribe(table: string, cb: (payload: MessagePayload) => void) {
    const event = this.getEventName(table);
    this.eventEmitter.on(event, cb);
  }
}
