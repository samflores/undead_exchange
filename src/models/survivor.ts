import { Model } from 'objection';
import TradeItem from './trade_item';

export enum Gender {
  Male = 'male',
  Female = 'female',
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

  id!: number;
  name!: string;
  age!: number;
  gender!: Gender;
  latitude!: number;
  longitude!: number;
  infected!: boolean;

  items!: Array<Partial<TradeItem & { quantity: number }>>;
  reportsReceived!: Array<Partial<Survivor & { created_at: Date, notes: string }>>;

  static jsonSchema = {
    type: 'object',
    required: [
      'name', 'age', 'gender', 'latitude', 'longitude',
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
      longitude: { type: 'number', minimum: -180, maximum: 180 },
    }
  };

  static relationMappings = () => ({
    items: {
      relation: Model.ManyToManyRelation,
      modelClass: TradeItem,
      join: {
        from: 'survivors.id',
        through: {
          from: 'ownership.survivor_id',
          to: 'ownership.item_id',
          extra: ['quantity']
        },
        to: 'trade_items.id'
      }
    },
    reportsMade: {
      relation: Model.ManyToManyRelation,
      modelClass: Survivor,
      join: {
        from: 'survivors.id',
        through: {
          from: 'infection_reports.reporter_id',
          to: 'infection_reports.reported_id',
          extra: ['created_at', 'notes']
        },
        to: 'survivors.id',
      }
    },
    reportsReceived: {
      relation: Model.ManyToManyRelation,
      modelClass: Survivor,
      join: {
        from: 'survivors.id',
        through: {
          from: 'infection_reports.reported_id',
          to: 'infection_reports.reporter_id',
          extra: ['created_at', 'notes']
        },
        to: 'survivors.id',
      }
    }
  });
}

export default Survivor;
