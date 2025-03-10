import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('ownership', (table) => {
    table.integer('survivor_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('survivors')
      .onDelete('CASCADE');
    table.integer('item_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('trade_items')
      .onDelete('CASCADE');
    table.integer('quantity').notNullable().unsigned();

    table.primary(['survivor_id', 'item_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('ownership');
}
