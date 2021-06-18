import { Injectable, Type } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { EVENT_LISTENER_METADATA } from "./const";
import { OnTriggerMetadata } from "./decorators/on-trigger.decorator";

@Injectable()
export class TriggerAccessor {
  constructor(private readonly reflector: Reflector) {}

  getEventHandlerMetadata(
    target: Type<unknown>,
  ): OnTriggerMetadata | undefined {
    return this.reflector.get(EVENT_LISTENER_METADATA, target);
  }
}
