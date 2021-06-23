# nestjs-database-trigger
[![NPM](https://nodei.co/npm/nestjs-database-trigger.png)](https://nodei.co/npm/nestjs-database-trigger/)

[![npm version](https://badge.fury.io/js/nestjs-database-trigger.svg)](https://badge.fury.io/js/nestjs-database-trigger)
![npm](https://img.shields.io/npm/dm/nestjs-database-trigger)

# Description

This is a SQL (currently support only PostgreSQL) database trigger module for [NestJS]("http://nestjs.com/") which allow you to use decorators on SQL triggers.

# Installation

```
$ npm install nestjs-database-trigger –save
```

# Example

app.module.ts

```ts
import { TriggerModule } from "nestjs-database-trigger";

TriggerModule.forRootAsync({
  imports: [UtilsModule],
  inject: [UtilsService],
  useFactory: async (utilsService: UtilsService) => ({
    connectionString: databaseUrl,
    tables: ["Notification"],
  }),
});
```

notification.service.ts

```ts
import { onTrigger } from "nestjs-database-trigger";

@Injectable()
export class NotificationService {
  constructor() {}

  @OnTrigger("Notification")
  async printout(payload: MessagePayload) {
    console.log(payload);
  }
}
```

Payload interface

```ts
interface MessagePayload<T = any> {
  table: string;
  action: "INSERT" | "UPDATE" | "DELETE";
  data: T | null;
  oldData: T | null;
}
```

# Roadmap

We plan to support other SQL database in the future.

# License

Nest is [MIT licensed](LICENSE).
