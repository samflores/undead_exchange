import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('trade_items').del();
  await knex.raw("DELETE FROM sqlite_sequence WHERE name='trade_items'");

  await knex('trade_items').insert([
    { name: 'Fiji Water', points: 14 },
    { name: 'Campbell Soup', points: 12 },
    { name: 'First Aid Pouch', points: 10 },
    { name: 'AK47', points: 8 }
  ]);
};
