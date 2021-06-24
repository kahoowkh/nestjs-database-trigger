import { Controller, Injectable, Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { TriggerModule, OnTrigger, MessagePayload } from "../src";
import { Client } from "pg";
import { TriggerService } from "../src/trigger.service";
import exp from "constants";

type User = {
  id: number;
  name: string;
};

const connection = process.env.DATABASE_URL || "";
let pg: Client;

const kaho: User = {
  id: 1,
  name: "kaho",
};

const marco: User = {
  id: 1,
  name: "marco",
};

describe(TriggerModule.name, () => {
  beforeAll(async () => {
    pg = new Client(connection);
    await pg.connect();

    const createUserTable = `
        DROP TABLE IF EXISTS "User";
        CREATE TABLE "User" (
           id   INT PRIMARY KEY NOT NULL,
           name TEXT NOT NULL
        );
      `;

    await pg.query(createUserTable).catch((e) => {
      console.error(e);
    });
  });

  afterAll(async () => {
    await pg.end();
  });

  it(TriggerModule.forRootAsync.name, async () => {
    @Injectable()
    class UtilsService {
      env: { dbUrl: string } = new (function (this: { dbUrl: string }) {
        this.dbUrl = connection;
      })();
    }

    @Module({
      providers: [UtilsService],
      exports: [UtilsService],
    })
    class UtilsModule {}

    @Controller()
    class TestController {
      @OnTrigger("User")
      async onInsertListener(payload: MessagePayload<User>) {
        if (payload.action !== "INSERT") return;
        expect(payload.data?.id).toBe(kaho.id);
        expect(payload.data?.name).toBe(kaho.name);
        expect(payload.oldData).toBeNull();
      }

      @OnTrigger("User")
      async onUpdateListener(payload: MessagePayload<User>) {
        if (payload.action !== "UPDATE") return;
        expect(payload.data?.id).toBe(marco.id);
        expect(payload.oldData?.name).toBe(kaho.name);
        expect(payload.data?.name).toBe(marco.name);
      }

      @OnTrigger("User")
      async onDeleteListener(payload: MessagePayload<User>) {
        if (payload.action !== "DELETE") return;
        expect(payload.data).toBeNull();
        expect(payload.oldData?.name).toBe(marco.name);
      }
    }

    @Module({
      imports: [
        TriggerModule.forRootAsync({
          imports: [UtilsModule],
          inject: [UtilsService],
          useFactory: async (utilsService: UtilsService) => ({
            connectionString: utilsService.env.dbUrl,
            tables: ["User"],
          }),
        }),
      ],
      controllers: [TestController],
    })
    class TestModule {}

    const app = await NestFactory.create(TestModule);
    await app.init();
    const service: TriggerService = app.get(TriggerService);

    expect(service).not.toBeNull();
    expect(service).not.toBeUndefined();

    await pg.query(
      `INSERT INTO "User" (id, name) VALUES (${kaho.id}, '${kaho.name}');`,
    );

    await pg.query(
      `UPDATE "User" set name = '${marco.name}' where id = ${marco.id};`,
    );

    await pg.query(`DELETE FROM "User" where id = ${marco.id};`);
    await app.close();
  });
});
