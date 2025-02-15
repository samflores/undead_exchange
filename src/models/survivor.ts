import { Model } from 'objection';

export enum Gender {
  Male = 'male',
  Feale = 'female',
  NonBinary = 'non-binary',
  Genderqueer = 'genderqueer',
  Genderfluid = 'genderfluid',
  Agender = 'agender',
  Bigender = 'bigender',
  Undisclosed = 'undisclosed',
  Other = 'other'
};

class Survivor extends Model {
  static tableName = 'survivors';

  id?: number;
  name!: string;
  age!: number;
  gender!: Gender;
  latitude!: number;
  longitude!: number;

  static jsonSchema = {
    type: 'object',
    required: [
      'name', 'age', 'gender', 'latitude', 'longitude'
    ],
    properties: {
      id: { type: 'integer' },
      name: { type: 'string', minLength: 1, maxLength: 255, pattern: '[^\\s]' },
      age: { type: 'integer', minimum: 0 },
      gender: {
        type: 'string',
        enum: Object.values(Gender),
      },
      latitude: { type: 'number', minimum: -90, maximum: 90 },
      longitude: { type: 'number', minimum: -180, maximum: 180 }
    }
  };
}

export default Survivor;
