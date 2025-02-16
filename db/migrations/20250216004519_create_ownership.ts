import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('ownership', (table) => {
    table.integer('survivor_id').references('id').inTable('survivors').notNullable();
    table.integer('item_id').references('id').inTable('items').notNullable();
    table.integer('quantity').notNullable().unsigned();

    table.primary(['survivor_id', 'item_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('ownership');
}
