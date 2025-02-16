import 'tests/setup';
import { Gender, Survivor, TradeItem } from 'src/models';
import { beforeEach, describe, expect, it } from 'vitest';
import { LightMyRequestResponse } from 'fastify';
import server from 'src/server';

describe('CREATE action', () => {
  const validInput = {
    name: 'Carl Grimes',
    age: 16,
    gender: Gender.Male,
    latitude: 34.0522,
    longitude: -118.2437,
    items: [
      {
        name: 'Water',
        quantity: 3,
      }
    ]
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
      const response = await makeRequest(input);

      expect(response.statusCode).toBe(201);
    });

    it('creates a new record', async () => {
      await assertCount(input, { changedBy: 1 });
    });

    it('returns the created survivor', async () => {
      const response = await makeRequest(input);

      const jsonResponse = response.json<Survivor>();
      expect(jsonResponse).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          name: input.name,
          gender: input.gender,
          latitude: input.latitude,
          longitude: input.longitude,
        })
      );
    });
  });

  describe('when the name is missing', () => {
    const { name, ...input } = validInput;

    it('does not create a new record', async () => {
      await assertCount(input, { changedBy: 0 });
    });

    it('returns a bad request response', async () => {
      const response = await makeRequest(input);

      await assertBadRequest(response, /must have required property 'name'/);
    });
  });

  describe('when the age is missing', () => {
    const { age, ...input } = validInput;

    it('does not create a new record', async () => {
      await assertCount(input, { changedBy: 0 });
    });

    it('returns a bad request response', async () => {
      const response = await makeRequest(input);

      await assertBadRequest(response, /must have required property 'age'/);
    });
  });

  describe('when the age is invalid', () => {
    const input = { ...validInput, age: -1 };

    it('does not create a new record', async () => {
      await assertCount(input, { changedBy: 0 });
    });

    it('returns a bad request response', async () => {
      const response = await makeRequest(input);
      await assertBadRequest(response, /must be >= 0/);
    });
  });

  describe('when the gender is missing', () => {
    const { gender, ...input } = validInput;

    it('does not create a new record', async () => {
      await assertCount(input, { changedBy: 0 });
    });

    it('returns a bad request response', async () => {
      const response = await makeRequest(input);
      await assertBadRequest(response, /must have required property 'gender'/);
    });
  });

  describe('when the gender is invalid', () => {
    const input = { ...validInput, gender: 'unknown' as Gender };

    it('does not create a new record', async () => {
      await assertCount(input, { changedBy: 0 });
    });

    it('returns a bad request response', async () => {
      const response = await makeRequest(input);
      await assertBadRequest(response, /must be equal to one of the allowed values/);
    });
  });

  describe('when the latitude is missing', () => {
    const { latitude, ...input } = validInput;

    it('does not create a new record', async () => {
      await assertCount(input, { changedBy: 0 });
    });

    it('returns a bad request response', async () => {
      const response = await makeRequest(input);
      await assertBadRequest(response, /must have required property 'latitude'/);
    });
  });

  describe('when the latitude is invalid', () => {
    const input = { ...validInput, latitude: -91 };

    it('does not create a new record', async () => {
      await assertCount(input, { changedBy: 0 });
    });

    it('returns a bad request response', async () => {
      const response = await makeRequest(input);
      await assertBadRequest(response, /must be >= -90/);
    });
  });

  describe('when the longitude is missing', () => {
    const { longitude, ...input } = validInput;

    it('does not create a new record', async () => {
      await assertCount(input, { changedBy: 0 });
    });

    it('returns a bad request response', async () => {
      const response = await makeRequest(input);
      await assertBadRequest(response, /must have required property 'longitude'/);
    });
  });

  describe('when the longitude is invalid', () => {
    const input = { ...validInput, longitude: -181 };

    it('does not create a new record', async () => {
      await assertCount(input, { changedBy: 0 });
    });

    it('returns a bad request response', async () => {
      const response = await makeRequest(input);
      await assertBadRequest(response, /must be >= -180/);
    });
  });

  describe('when the items are missing', () => {
    const { items, ...input } = validInput;

    it('does not create a new record', async () => {
      await assertCount(input, { changedBy: 0 });
    });

    it('returns a bad request response', async () => {
      const response = await makeRequest(input);
      await assertBadRequest(response, /must provide at least one item/);
    });
  });

  describe('when the items are empty', () => {
    const input = { ...validInput, items: [] };

    it('does not create a new record', async () => {
      await assertCount(input, { changedBy: 0 });
    });

    it('returns a bad request response', async () => {
      const response = await makeRequest(input);
      await assertBadRequest(response, /must provide at least one item/);
    });
  });

  describe('when an item is unknown', () => {
    const input = {
      ...validInput,
      items: [
        { name: 'Potato', quantity: 1 },
        { name: 'Water', quantity: 1 }
      ]
    };

    it('does not create a new record', async () => {
      await assertCount(input, { changedBy: 0 });
    });

    it('returns a bad request response', async () => {
      const response = await makeRequest(input);
      await assertBadRequest(response, /unknown item: Potato/);
    });
  });

  describe('when multiple items are unknown', () => {
    const input = {
      ...validInput,
      items: [
        { name: 'Potato', quantity: 1 },
        { name: 'Revolver', quantity: 1 },
        { name: 'Water', quantity: 1 }
      ]
    };

    it('does not create a new record', async () => {
      await assertCount(input, { changedBy: 0 });
    });

    it('returns a bad request response', async () => {
      const response = await makeRequest(input);
      await assertBadRequest(response, /unknown items: Potato, Revolver/);
    });
  });

  describe('when the quantity of any item is invalid', () => {
    const input = {
      ...validInput,
      items: [
        { name: 'Water', quantity: -1 },
        { name: 'Soup', quantity: 1 }
      ]
    };

    it('does not create a new record', async () => {
      await assertCount(input, { changedBy: 0 });
    });

    it('returns a bad request response', async () => {
      const response = await makeRequest(input);
      await assertBadRequest(response, /all quantities must be >= 0, got: -1 for Water/);
    });
  });

  describe('when the quantity of an unknown item is invalid', () => {
    const input = {
      ...validInput,
      items: [
        { name: 'Revolver', quantity: -1 },
        { name: 'Soup', quantity: 1 }
      ]
    };

    it('does not create a new record', async () => {
      await assertCount(input, { changedBy: 0 });
    });

    it('returns a bad request response', async () => {
      const response = await makeRequest(input);
      await assertBadRequest(response, /unknown item: Revolver/);
    });
  });

  const makeRequest = async (input: Partial<Survivor>) =>
    server.inject({
      method: 'POST',
      url: '/survivors',
      body: input,
    });

  const countRecords = async (input: Partial<Survivor>) =>
    Survivor.query().where(input).resultSize();

  const assertCount = async (input: Partial<Survivor>, { changedBy }: { changedBy: number }) => {
    const { items, ...inputWithoutItems } = input;
    const initialCount = await countRecords(inputWithoutItems);

    await makeRequest(input);

    const finalCount = await countRecords(inputWithoutItems);

    expect(finalCount).toBe(initialCount + changedBy);
  };

  const assertBadRequest = async (response: LightMyRequestResponse, message: RegExp | string) => {
    const json_response = response.json<{ message: string }>();
    expect(response.statusCode).toBe(400);
    expect(json_response.message).toMatch(message);
  };
});
