import 'tests/setup';
import { Gender, Survivor, TradeItem } from 'src/models';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LightMyRequestResponse } from 'fastify';
import { type Input as ReportInput } from 'src/actions/survivors/report_infection';
import server from 'src/server';

describe('REPORT action', () => {
  const validInput = {
    reporterId: 1,
    notes: 'Saw a bite mark on his arm',
  };

  beforeEach(async () => {
    await Promise.all([
      createSurvivor('Rick Grimes'),
      TradeItem.query().insert({ name: 'Water', points: 10 }),
      TradeItem.query().insert({ name: 'Soup', points: 8 }),
      TradeItem.query().insert({ name: 'First Aid Kit', points: 9 }),
      TradeItem.query().insert({ name: 'Rifle', points: 7 }),
    ]);
  });

  describe('when the input is valid', () => {
    const input = validInput;

    it('is successful', async () => {
      const survivor = await createSurvivor('Carl Grimes');

      const response = await makeRequest(survivor.id, input);

      expect(response.statusCode).toBe(200);
    });

    it('does NOT create a new record', async () => {
      const survivor = await createSurvivor('Carl Grimes');
      await assertCount(survivor, input, { changedBy: 0 });
    });

    it('returns the created survivor', async () => {
      const survivor = await createSurvivor('Carl Grimes');
      const response = await makeRequest(survivor.id, input);

      const jsonResponse = response.json<Survivor>();
      expect(jsonResponse).toEqual(
        expect.objectContaining({
          id: survivor.id,
          reportsReceived: [
            {
              id: input.reporterId,
              notes: input.notes,
            }
          ]
        })
      );
    });
  });

  describe('when the reporterId is missing', async () => {
    it('is unsuccessful', async () => {
      const { reporterId, ...input } = validInput;

      const survivor = await createSurvivor('Carl Grimes');
      const response = await makeRequest(survivor.id, input as ReportInput);

      await assertBadRequest(response, /reporterId is required/);
    });
  });

  describe('when the reporterId is not a valid survivor id', async () => {
    it('is unsuccessful', async () => {
      const input = { ...validInput, reporterId: 999 };

      const survivor = await createSurvivor('Carl Grimes');
      const response = await makeRequest(survivor.id, input);

      await assertBadRequest(response, /invalid reporterId/);
    });
  });

  describe('when the reporterId is the same as the reported survivor', async () => {
    it('is unsuccessful', async () => {
      const survivor = await createSurvivor('Carl Grimes');
      const input = { ...validInput, reporterId: survivor.id };

      const response = await makeRequest(survivor.id, input);

      await assertBadRequest(response, /invalid reporterId/);
    });
  });

  describe('when the reporter has already reported the survivor', async () => {
    it('is does NOT insert another report', async () => {
      const survivor = await createSurvivor('Carl Grimes');

      const input1 = { ...validInput, notes: 'Saw a bite mark on his arm' };
      const response1 = await makeRequest(survivor.id, input1);
      expect(response1.statusCode).toBe(200);

      const input2 = { ...validInput, notes: 'Saw an walker ignore him' };
      const response2 = await makeRequest(survivor.id, input2);
      expect(response2.statusCode).toBe(200);

      const updatedTarget = await Survivor.query()
        .where('id', survivor.id)
        .withGraphFetched('reportsReceived').first();

      expect(updatedTarget?.reportsReceived).toHaveLength(1);
      expect(updatedTarget?.reportsReceived).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: input1.reporterId,
            notes: input1.notes,
          })
        ])
      );
    });
  });

  describe('when the reported survivor is not found', async () => {
    it('is unsuccessful', async () => {
      const response = await makeRequest(999, validInput);

      const json_response = response.json<{ message: string }>();
      expect(response.statusCode).toBe(404);
      expect(json_response.message).toMatch(/Survivor not found/);
    });
  });

  describe('when the notes are missing', async () => {
    const input = { ...validInput, notes: undefined };

    it('is successful', async () => {
      const survivor = await createSurvivor('Carl Grimes');

      const response = await makeRequest(survivor.id, input);

      expect(response.statusCode).toBe(200);
    });

    it('does NOT create a new record', async () => {
      const survivor = await createSurvivor('Carl Grimes');
      await assertCount(survivor, input, { changedBy: 0 });
    });

    it('returns the created survivor', async () => {
      const survivor = await createSurvivor('Carl Grimes');
      const response = await makeRequest(survivor.id, input);

      const jsonResponse = response.json<Survivor>();
      expect(jsonResponse).toEqual(
        expect.objectContaining({
          id: survivor.id,
          reportsReceived: [
            {
              id: input.reporterId,
            }
          ]
        })
      );
    });
  });

  describe('when an unexpected error occurs', async () => {
    it('returns a 500 response', async () => {
      const spy = vi
        .spyOn(Survivor.QueryBuilder.prototype, 'upsertGraph')
        .mockImplementation(() => {
          throw new Error('Unexpected error from upsertGraph');
        });

      const survivor = await createSurvivor('Carl Grimes');

      const response = await makeRequest(survivor.id, validInput);

      expect(response.statusCode).toBe(500);

      spy.mockRestore();
    });
  });

  describe('when it is the 4rd report', async () => {
    it('does NOT flags the survivor as infected', async () => {
      const survivor = await createSurvivor('Carl Grimes');

      const reporters = await Promise.all([
        createSurvivor('Rick Grimes'),
        createSurvivor('Daryl Dixon'),
        createSurvivor('Michonne'),
        createSurvivor('Glenn Rhee'),
      ]);

      const responses = await Promise.all([
        makeRequest(survivor.id, { reporterId: reporters[0].id, notes: 'Saw a bite mark on his arm' }),
        makeRequest(survivor.id, { reporterId: reporters[1].id, notes: 'Was acting suspiciously' }),
        makeRequest(survivor.id, { reporterId: reporters[2].id, notes: 'Saw him coughing' }),
        makeRequest(survivor.id, { reporterId: reporters[3].id, notes: 'He looks too anxious' })
      ]);

      for (const response of responses) {
        expect(response.statusCode).toBe(200);
      }

      const updatedTarget = await Survivor.query().findById(survivor.id);
      expect(updatedTarget?.infected).toBe(0);
    });
  });

  describe('when it is the 5rd report', async () => {
    it('flags the survivor as infected', async () => {
      const survivor = await createSurvivor('Carl Grimes');
      const reporters = await Promise.all([
        createSurvivor('Rick Grimes'),
        createSurvivor('Daryl Dixon'),
        createSurvivor('Michonne'),
        createSurvivor('Glenn Rhee'),
        createSurvivor('Andrea')
      ]);

      const responses = await Promise.all([
        makeRequest(survivor.id, { reporterId: reporters[0].id, notes: "I don't like him" }),
        makeRequest(survivor.id, { reporterId: reporters[1].id, notes: 'Saw a bite mark on his arm' }),
        makeRequest(survivor.id, { reporterId: reporters[2].id, notes: 'Was acting suspiciously' }),
        makeRequest(survivor.id, { reporterId: reporters[3].id, notes: 'Saw him coughing' }),
        makeRequest(survivor.id, { reporterId: reporters[4].id, notes: 'He looks too anxious' }),
      ]);

      for (const response of responses) {
        expect(response.statusCode).toBe(200);
      }

      const updatedTarget = await Survivor.query().findById(survivor.id);
      expect(updatedTarget?.infected).toBe(1);
    });
  });

  describe('when the survivor is already infected', async () => {
    it('keeps the survivor as infected', async () => {
      const input = {
        name: 'Brian Blake',
        age: 40,
        gender: Gender.Male,
        latitude: 34.0522,
        longitude: -118.2437,
        infected: true,
        items: [{ id: 1, quantity: 3 }]
      };
      const survivor = await Survivor.query().insertGraph(input, { relate: true });

      const reporters = await Promise.all([
        createSurvivor('Rick Grimes'),
        createSurvivor('Daryl Dixon'),
        createSurvivor('Michonne'),
      ]);

      const responses = await Promise.all([
        makeRequest(survivor.id, { reporterId: reporters[0].id, notes: 'Saw a bite mark on his arm' }),
        makeRequest(survivor.id, { reporterId: reporters[1].id, notes: 'Was acting suspiciously' }),
        makeRequest(survivor.id, { reporterId: reporters[2].id, notes: 'Saw him coughing' }),
      ]);

      for (const response of responses) {
        expect(response.statusCode).toBe(200);
      }

      const updatedTarget = await Survivor.query().findById(survivor.id);
      expect(updatedTarget?.infected).toBe(1);
    });
  });

  const makeRequest = async (id: number, input: ReportInput) =>
    server.inject({
      method: 'POST',
      url: `/survivors/${id}/infection-reports`,
      body: input,
    });

  const countRecords = async (input: Partial<Survivor>) =>
    Survivor.query().where(input).resultSize();

  const assertCount = async (oldSurvivor: Survivor, input: ReportInput, { changedBy }: { changedBy: number }) => {
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

  const createSurvivor = async (name: string) =>
    await Survivor.query()
      .insertGraph({
        name,
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
