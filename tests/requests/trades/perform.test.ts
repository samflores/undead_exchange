import 'tests/setup';
import { Gender, Survivor, TradeItem } from 'src/models';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LightMyRequestResponse } from 'fastify';
import { Input as TradeInput } from 'src/actions/trades/perform';
import knex from 'src/db';
import server from 'src/server';

describe('TRADE action', () => {
  beforeEach(async () => {
    await Promise.all([
      TradeItem.query().insert({ name: 'Water', points: 10 }),
      TradeItem.query().insert({ name: 'Soup', points: 8 }),
      TradeItem.query().insert({ name: 'First Aid Kit', points: 9 }),
      TradeItem.query().insert({ name: 'Rifle', points: 5 }),
    ]);
  });

  describe('when the trade is valid', () => {
    it('is successful', async () => {
      const s1 = await createSurvivor('Rick Grimes', [{ id: 1, quantity: 5 }]);
      const s2 = await createSurvivor('Brian Blake', [{ id: 4, quantity: 10 }]);
      const tradeInput = {
        survivor1: { id: s1.id, items: [{ id: 1, quantity: 2 }] },
        survivor2: { id: s2.id, items: [{ id: 4, quantity: 4 }] },
      };

      const response = await makeRequest(tradeInput);

      expect(response.json()).toEqual({ message: 'trade successful' });
      expect(response.statusCode).toBe(200);
    });
  });

  describe('when a survivor does not own the item they are offering', () => {
    it('is unsuccessful', async () => {
      const s1 = await createSurvivor('Rick Grimes', [{ id: 1, quantity: 1 }]);
      const s2 = await createSurvivor('Brian Blake', [{ id: 2, quantity: 3 }]);
      const tradeInput = {
        survivor1: { id: s1.id, items: [{ id: 1, quantity: 1 }] },
        survivor2: { id: s2.id, items: [{ id: 3, quantity: 2 }] },
      };

      const response = await makeRequest(tradeInput);

      expect(response.statusCode).toBe(400);
      expect(response.json().message).toMatch(`survivor ${s2.id} does not have enough of item 3 (requested 2, owned 0)`);
    });
  });

  describe('when a survivor does not have enough inventory', () => {
    it('is unsuccessful', async () => {
      const s1 = await createSurvivor('Rick Grimes', [{ id: 1, quantity: 1 }]);
      const s2 = await createSurvivor('Brian Blake', [{ id: 2, quantity: 3 }]);
      const tradeInput = {
        survivor1: { id: s1.id, items: [{ id: 1, quantity: 2 }] },
        survivor2: { id: s2.id, items: [{ id: 2, quantity: 2 }] },
      };

      const response = await makeRequest(tradeInput);

      expect(response.statusCode).toBe(400);
      expect(response.json().message).toMatch(`survivor ${s1.id} does not have enough of item 1 (requested 2, owned 1)`);
    });
  });

  describe('when trade points do not match', () => {
    it('returns an error', async () => {
      const s1 = await createSurvivor('Rick Grimes', [{ id: 1, quantity: 5 }]);
      const s2 = await createSurvivor('Brian Blake', [{ id: 3, quantity: 3 }]);
      const tradeInput = {
        survivor1: { id: s1.id, items: [{ id: 1, quantity: 3 }] },
        survivor2: { id: s2.id, items: [{ id: 3, quantity: 2 }] },
      };

      const response = await makeRequest(tradeInput);

      expect(response.statusCode).toBe(400);
      expect(response.json().message).toMatch(`trade points do not match: survivor ${s1.id} total 30, survivor ${s2.id} total 18`);
    });
  });

  describe('when the offered item does not exist', () => {
    it('is unsuccessful', async () => {
      const s1 = await createSurvivor('Rick Grimes', [{ id: 1, quantity: 5 }]);
      const s2 = await createSurvivor('Brian Blake', [{ id: 1, quantity: 3 }]);
      const tradeInput = {
        survivor1: { id: s1.id, items: [{ id: 999, quantity: 2 }] },
        survivor2: { id: s2.id, items: [{ id: 666, quantity: 2 }] },
      };

      const response = await makeRequest(tradeInput);

      expect(response.statusCode).toBe(400);
      expect(response.json().message).toMatch('trade items not found: 999');
    });
  });

  describe('when the survivor already owns some of the received item', () => {
    it('updates destination ownership when record exists', async () => {
      const s1 = await createSurvivor('Rick Grimes', [{ id: 1, quantity: 5 }]);
      const s2 = await createSurvivor('Brian Blake', [{ id: 1, quantity: 1 }, { id: 4, quantity: 10 }]);

      const tradeInput: TradeInput = {
        survivor1: { id: s1.id, items: [{ id: 1, quantity: 2 }] },
        survivor2: { id: s2.id, items: [{ id: 4, quantity: 4 }] },
      };

      const response = await makeRequest(tradeInput);
      expect(response.json()).toEqual({ message: 'trade successful' });
      expect(response.statusCode).toBe(200);

      const bobQty = await getOwnership(s2.id, 1);
      expect(bobQty).toBe(3);
    });
  });

  describe('when an unexpected error occurs', async () => {
    it('returns a 500 response', async () => {
      interface CustomQueryBuilder {
        decrement(column: string, amount?: number): this;
      }
      const qb = knex('ownership');
      const proto = Object.getPrototypeOf(qb) as CustomQueryBuilder;
      const spy = vi.spyOn(proto, 'decrement')
        .mockImplementation(() => {
          throw new Error('Unexpected error from upsertGraph');
        });

      const s1 = await createSurvivor('Rick Grimes', [{ id: 1, quantity: 5 }]);
      const s2 = await createSurvivor('Brian Blake', [{ id: 1, quantity: 1 }, { id: 4, quantity: 10 }]);

      const tradeInput: TradeInput = {
        survivor1: { id: s1.id, items: [{ id: 1, quantity: 2 }] },
        survivor2: { id: s2.id, items: [{ id: 4, quantity: 4 }] },
      };

      const response = await makeRequest(tradeInput);

      expect(response.statusCode).toBe(500);

      spy.mockRestore();
    });
  });

  const makeRequest = async (input: TradeInput): Promise<LightMyRequestResponse> => {
    return server.inject({
      method: 'POST',
      url: '/trades',
      body: input,
    });
  };

  const getOwnership = async (survivorId: number, itemId: number): Promise<number | null> => {
    const record = await knex('ownership')
      .select('quantity')
      .where({ survivor_id: survivorId, item_id: itemId })
      .first();
    return record ? record.quantity : 0;
  };

  const createSurvivor = async (
    name: string,
    items: { id: number; quantity: number }[]
  ) => {
    return Survivor.query().insertGraph(
      {
        name,
        age: 16,
        gender: Gender.Male,
        latitude: 34.0522,
        longitude: -118.2437,
        items,
      },
      { relate: true }
    );
  };
});
