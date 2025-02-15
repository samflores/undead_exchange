import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('survivors', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.integer('age').notNullable().unsigned();
    table.enu('gender', [
      'male',
      'female',
      'non-binary',
      'genderqueer',
      'genderfluid',
      'agender',
      'bigender',
      'undisclosed',
      'other'
    ], {
      useNative: true,
      enumName: 'gender_type'
    }).notNullable();
    table.decimal('latitude', 10, 6).notNullable().unsigned();
    table.decimal('longitude', 10, 6).notNullable().unsigned();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('survivors');
}
