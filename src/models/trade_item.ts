import { Model } from 'objection';

class TradeItem extends Model {
  static tableName = 'trade_items';

  id?: number;
  name!: string;
  points!: number;

  static jsonSchema = {
    type: 'object',
    required: [
      'name', 'points'
    ],
    properties: {
      id: { type: 'integer' },
      name: { type: 'string', minLength: 1, maxLength: 255, pattern: '[^\\s]' },
      points: { type: 'integer', minimum: 0 }
    }
  };
}

export default TradeItem;
