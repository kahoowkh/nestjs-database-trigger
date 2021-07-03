import { ModuleMetadata } from "@nestjs/common";

export enum Client {
  pg = "pg",
}

export interface MessagePayload<T = any> {
  table: string;
  action: "INSERT" | "UPDATE" | "DELETE";
  data: T | null;
  oldData: T | null;
}

export interface ConnectOptions {
  client: Client;
  connectionString: string;
  tables: string[];
}

export interface ConnectAsyncOptions extends Pick<ModuleMetadata, "imports"> {
  useFactory: (...args: any[]) => Promise<ConnectOptions> | ConnectOptions;
  inject?: any[];
}
