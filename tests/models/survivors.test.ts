import 'tests/setup';
import Survivor, { Gender } from 'src/models/survivor';
import { describe, expect, it } from 'vitest';

describe('Survivor', () => {
  const validInput = {
    name: 'Daryl Dixon',
    age: 40,
    gender: Gender.Male,
    latitude: 34.0522,
    longitude: -118.2437,
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

  describe('when items are present', () => {
    const input = {
      ...validInput,
      items: [
        {
          name: 'Crossbow',
          points: 10,
          quantity: 1,
        }
      ]
    };

    it('saves the record', async () => {
      assertCount(input, { changedBy: 1 });
    });

    it('returns the created survivor and its items', async () => {
      const survivor = await saveRecord(input);

      expect(survivor).toEqual(
        expect.objectContaining({
          ...input,
          id: expect.any(Number),
          items: expect.arrayContaining(
            input.items.map(item => expect.objectContaining({
              ...item,
              id: expect.any(Number)
            }))
          ),
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

  describe('when the age is missing', () => {
    const input = { ...validInput, age: undefined };

    it('does not save the record', async () => {
      await expect(saveRecord(input)).rejects.toThrowError("age: must have required property 'age'");
    });
  });

  describe('when the age is less than 0', () => {
    const input = { ...validInput, age: -1 };

    it('does not save the record', async () => {
      await expect(saveRecord(input)).rejects.toThrowError('age: must be >= 0');
    });
  });

  describe('when the gender is missing', () => {
    const input = { ...validInput, gender: undefined };

    it('does not save the record', async () => {
      await expect(saveRecord(input)).rejects.toThrowError("gender: must have required property 'gender'");
    });
  });

  describe('when latitude is missing', () => {
    const input = { ...validInput, latitude: undefined };

    it('does not save the record', async () => {
      await expect(saveRecord(input)).rejects.toThrowError("latitude: must have required property 'latitude'");
    });
  });

  describe('when latitude is less than -90', () => {
    const input = { ...validInput, latitude: -91 };

    it('does not save the record', async () => {
      await expect(saveRecord(input)).rejects.toThrowError('latitude: must be >= -90');
    });
  });

  describe('when latitude is greater than 90', () => {
    const input = { ...validInput, latitude: 91 };

    it('does not save the record', async () => {
      await expect(saveRecord(input)).rejects.toThrowError('latitude: must be <= 90');
    });
  });

  describe('when longitude is missing', () => {
    const input = { ...validInput, longitude: undefined };

    it('does not save the record', async () => {
      await expect(saveRecord(input)).rejects.toThrowError("longitude: must have required property 'longitude'");
    });
  });

  describe('when longitude is less than -180', () => {
    const input = { ...validInput, longitude: -181 };

    it('does not save the record', async () => {
      await expect(saveRecord(input)).rejects.toThrowError('longitude: must be >= -180');
    });
  });

  describe('when longitude is greater than 180', () => {
    const input = { ...validInput, longitude: 181 };

    it('does not save the record', async () => {
      await expect(saveRecord(input)).rejects.toThrowError('longitude: must be <= 180');
    });
  });

  const countRecords = async (input: Partial<Survivor>) => {
    const { items, ...survivorInput } = input;
    return Survivor.query().where(survivorInput).resultSize();
  };

  const assertCount = async (input: Partial<Survivor>, { changedBy }: { changedBy: number }) => {
    const initialCount = await countRecords(input);

    await saveRecord(input);

    const finalCount = await countRecords(input);

    expect(finalCount).toBe(initialCount + changedBy);
  };

  const saveRecord = async (input: Partial<Survivor>) =>
    Survivor.query().insertGraphAndFetch(input);

});
