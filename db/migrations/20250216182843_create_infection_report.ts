import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('infection_reports', (table) => {
    table.integer('reporter_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('survivors')
      .onDelete('CASCADE');
    table.integer('reported_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('survivors')
      .onDelete('CASCADE');
    table.text('notes');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.primary(['reporter_id', 'reported_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('infection_reports');
}
