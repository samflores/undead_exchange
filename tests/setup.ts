import 'ts-node/register';
import { afterAll, beforeAll, beforeEach } from 'vitest';
import knex from 'src/db';

beforeAll(async () => await knex.migrate.latest());

beforeEach(async () => {
  const tables = await knex.raw(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';"
  );
  for (const { name } of tables) {
    await knex(name).delete();
    await knex.raw(`DELETE FROM sqlite_sequence WHERE name='${name}'`);
  }
});

afterAll(async () => await knex.destroy());
