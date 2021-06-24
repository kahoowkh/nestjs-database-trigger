# nestjs-database-trigger
<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-1-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->
[![NPM](https://nodei.co/npm/nestjs-database-trigger.png)](https://nodei.co/npm/nestjs-database-trigger/)

[![npm version](https://badge.fury.io/js/nestjs-database-trigger.svg)](https://badge.fury.io/js/nestjs-database-trigger)
![npm](https://img.shields.io/npm/dm/nestjs-database-trigger)
[![CircleCI](https://circleci.com/gh/kahoowkh/nestjs-database-trigger.svg?style=svg)](https://circleci.com/gh/kahoowkh/nestjs-database-trigger)

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

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/kahoowkh"><img src="https://avatars.githubusercontent.com/u/26565078?v=4?s=100" width="100px;" alt=""/><br /><sub><b>kahoowkh</b></sub></a><br /><a href="https://github.com/kahoowkh/nestjs-database-trigger/commits?author=kahoowkh" title="Documentation">📖</a> <a href="https://github.com/kahoowkh/nestjs-database-trigger/commits?author=kahoowkh" title="Tests">⚠️</a> <a href="https://github.com/kahoowkh/nestjs-database-trigger/commits?author=kahoowkh" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/Marcotsept"><img src="https://avatars.githubusercontent.com/u/17099973?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Marco Tse</b></sub></a><br /><a href="https://github.com/kahoowkh/nestjs-database-trigger/commits?author=Marcotsept" title="Documentation">📖</a> <a href="https://github.com/kahoowkh/nestjs-database-trigger/commits?author=Marcotsept" title="Tests">⚠️</a> <a href="https://github.com/kahoowkh/nestjs-database-trigger/commits?author=Marcotsept" title="Code">💻</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!