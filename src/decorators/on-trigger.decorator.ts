import { SetMetadata } from "@nestjs/common";
import { EVENT_LISTENER_METADATA } from "../const";

export interface OnTriggerMetadata {
  tableName: string;
}

export const OnTrigger = (tableName: string): MethodDecorator =>
  SetMetadata(EVENT_LISTENER_METADATA, { tableName } as OnTriggerMetadata);
