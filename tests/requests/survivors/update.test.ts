import 'tests/setup';
import { Gender, Survivor, TradeItem } from 'src/models';
import { beforeEach, describe, expect, it } from 'vitest';
import { LightMyRequestResponse } from 'fastify';
import server from 'src/server';

describe('UPDATE action', () => {
  const validInput = {
    latitude: 34.0522,
    longitude: -118.2437,
  };

  beforeEach(async () => {
    await Promise.all([
      TradeItem.query().insert({ name: 'Water', points: 10 }),
      TradeItem.query().insert({ name: 'Soup', points: 8 }),
      TradeItem.query().insert({ name: 'First Aid Kit', points: 9 }),
      TradeItem.query().insert({ name: 'Rifle', points: 7 }),
    ]);
  });

  describe('when the input is valid', () => {
    const input = validInput;

    it('is successful', async () => {
      const survivor = await createSurvivor();

      const response = await makeRequest(survivor.id, input);

      expect(response.statusCode).toBe(200);
    });

    it('does NOT create a new record', async () => {
      const survivor = await createSurvivor();
      await assertCount(survivor, input, { changedBy: 0 });
    });

    it('returns the created survivor', async () => {
      const survivor = await createSurvivor();
      const response = await makeRequest(survivor.id, input);

      const jsonResponse = response.json<Survivor>();
      expect(jsonResponse).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          latitude: input.latitude,
          longitude: input.longitude,
        })
      );
    });
  });

  describe('when the latitude is missing', async () => {
    it('is unsuccessful', async () => {
      const { latitude, ...input } = validInput;

      const survivor = await createSurvivor();
      const response = await makeRequest(survivor.id, input);

      await assertBadRequest(response, /latitude is required/);
    });
  });

  describe('when the latitude is invalid', async () => {
    it('is unsuccessful', async () => {
      const input = { ...validInput, latitude: -91 };

      const survivor = await createSurvivor();
      const response = await makeRequest(survivor.id, input);

      await assertBadRequest(response, /latitude: must be >= -90/);
    });
  });

  describe('when the longitude is missing', async () => {
    it('is unsuccessful', async () => {
      const { longitude, ...input } = validInput;

      const survivor = await createSurvivor();
      const response = await makeRequest(survivor.id, input);

      await assertBadRequest(response, /longitude is required/);
    });
  });

  describe('when the longitude is invalid', async () => {
    it('is unsuccessful', async () => {
      const input = { ...validInput, longitude: 181 };

      const survivor = await createSurvivor();
      const response = await makeRequest(survivor.id, input);

      await assertBadRequest(response, /longitude: must be <= 180/);
    });
  });

  describe('when trying to update inventory', async () => {
    it('is unsuccessful', async () => {
      const items = [
        {
          id: 1,
          quantity: 3,
        }
      ];
      const input = { ...validInput, items };

      const survivor = await createSurvivor();
      const response = await makeRequest(survivor.id, input);

      await assertBadRequest(response, /unexpected fields: items/);
    });
  });

  describe('when the survivor is NOT found', () => {
    it('is not found', async () => {
      const survivor = await createSurvivor();
      const response = await makeRequest(survivor.id + 1, validInput);

      expect(response.statusCode).toBe(404);
      const json_response = response.json<{ message: string }>();
      expect(json_response).toEqual({
        message: 'Survivor not found',
      });
    });
  });

  const makeRequest = async (id: number, input: Partial<Survivor>) =>
    server.inject({
      method: 'PATCH',
      url: `/survivors/${id}`,
      body: input,
    });

  const countRecords = async (input: Partial<Survivor>) =>
    Survivor.query().where(input).resultSize();

  const assertCount = async (oldSurvivor: Survivor, input: Partial<Survivor>, { changedBy }: { changedBy: number }) => {
    const initialCount = await countRecords({});
    expect(initialCount).toBeGreaterThan(0);

    await makeRequest(oldSurvivor.id, input);

    const finalCount = await countRecords({});

    expect(finalCount).toBe(initialCount + changedBy);
  };

  const assertBadRequest = async (response: LightMyRequestResponse, message: RegExp | string) => {
    const json_response = response.json<{ message: string }>();
    expect(response.statusCode).toBe(400);
    expect(json_response.message).toMatch(message);
  };

  const createSurvivor = async () =>
    await Survivor.query()
      .insertGraph({
        name: 'Carl Grimes',
        age: 16,
        gender: Gender.Male,
        latitude: 34.0522,
        longitude: -118.2437,
        items: [
          {
            id: 1,
            quantity: 3,
          }
        ]
      },
        { relate: true });
});
