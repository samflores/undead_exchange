import type { Knex } from 'knex';
import sqlite3 from 'sqlite3';

const config: Record<string, Knex.Config> = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: './db/dev.sqlite3'
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './db/migrations',
      extension: 'ts',
    },
    seeds: {
      directory: './db/seeds',
    },
    useNullAsDefault: true,
    pool: {
      afterCreate: (conn: sqlite3.Database, done: (err: Error | null, conn?: sqlite3.Database) => void) => {
        conn.run('PRAGMA foreign_keys = ON', done);
      },
    },
  },
  test: {
    client: 'sqlite3',
    connection: {
      filename: ':memory:'
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './db/migrations',
      extension: 'ts',
    },
    seeds: {
      directory: './db/seeds',
    },
    useNullAsDefault: true,
    pool: {
      afterCreate: (conn: sqlite3.Database, done: (err: Error | null, conn?: sqlite3.Database) => void) => {
        conn.run('PRAGMA foreign_keys = ON', done);
      },
    },
  },
};

export default config;
