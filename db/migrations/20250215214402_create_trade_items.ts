import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('trade_items', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable().unique();
    table.integer('points').notNullable().unsigned();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('trade_items');
}
