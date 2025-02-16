import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('survivors', (table) => {
    table.boolean('infected').defaultTo(false);
  });

  await knex.schema.raw(`
    CREATE TRIGGER set_infected_after_insert
    AFTER INSERT ON infection_reports
    FOR EACH ROW
    WHEN (
      (SELECT COUNT(*) FROM infection_reports WHERE reported_id = NEW.reported_id) >= 5
    )
    BEGIN
      UPDATE survivors
      SET infected = 1
      WHERE id = NEW.reported_id;
    END;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.raw('DROP TRIGGER IF EXISTS set_infected_after_insert;');

  await knex.schema.alterTable('survivors', (table) => {
    table.dropColumn('infected');
  });
}

