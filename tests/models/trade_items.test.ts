import 'tests/setup';
import { describe, it, expect } from 'vitest';
import TradeItem from 'src/models/trade_item';

describe('TradeItem', () => {
  const validInput = {
    name: 'Water',
    points: 14,
  };

  describe('when the input is valid', () => {
    const input = validInput;

    it('saves the record', async () => {
      assertCount(input, { changedBy: 1 });
    });

    it('returns the created survivor', async () => {
      const survivor = await saveRecord(input);

      expect(survivor).toEqual(
        expect.objectContaining({
          ...input,
          id: expect.any(Number),
        })
      );
    });
  });

  describe('when the name is missing', () => {
    const input = { ...validInput, name: undefined };

    it('does not save the record', async () => {
      await expect(saveRecord(input)).rejects.toThrowError("name: must have required property 'name'");
    });
  });

  describe('when the name is empty', () => {
    const input = { ...validInput, name: '' };

    it('does not save the record', async () => {
      await expect(saveRecord(input)).rejects.toThrowError('name: must match pattern "[^\\s]"');
    });
  });

  describe('when the name is blank', () => {
    const input = { ...validInput, name: '   ' };

    it('does not save the record', async () => {
      await expect(saveRecord(input)).rejects.toThrowError('name: must match pattern "[^\\s]"');
    });
  });

  describe('when the points is missing', () => {
    const input = { ...validInput, points: undefined };

    it('does not save the record', async () => {
      await expect(saveRecord(input)).rejects.toThrowError("points: must have required property 'points'");
    });
  });

  describe('when the points is less than 0', () => {
    const input = { ...validInput, points: -1 };

    it('does not save the record', async () => {
      await expect(saveRecord(input)).rejects.toThrowError('points: must be >= 0');
    });
  });

  describe('when the points is not an integer', () => {
    const input = { ...validInput, points: 1.3 };

    it('does not save the record', async () => {
      await expect(saveRecord(input)).rejects.toThrowError('points: must be integer');
    });
  });

  const countRecords = async (input: Partial<TradeItem>) =>
    TradeItem.query().where(input).resultSize();

  const assertCount = async (input: Partial<TradeItem>, { changedBy }: { changedBy: number }) => {
    const initialCount = await countRecords(input);

    await saveRecord(input);

    const finalCount = await countRecords(input);

    expect(finalCount).toBe(initialCount + changedBy);
  };

  const saveRecord = async (input: Partial<TradeItem>) =>
    TradeItem.query().insert(input);
});
