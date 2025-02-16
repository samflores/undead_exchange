import { FastifyReply, FastifyRequest } from 'fastify';
import { Gender, Survivor, TradeItem } from 'src/models';
import { InvalidItemQuantityError, MissingItemsError, UnknownItemsError } from 'src/actions/errors';

type Input = {
  name: string;
  age: number;
  gender: string;
  latitude: number;
  longitude: number;
  items: Array<{
    name: string;
    quantity: number;
  }>
};

type TransformedInput = Omit<Input, 'gender' | 'items'> & {
  gender: Gender;
  items: Array<{
    id: number;
    quantity: number;
  }>;
};

type Request = FastifyRequest<{ Body: Input }>;

export default async (
  { body: input }: Request,
  reply: FastifyReply
) => {
  return normalizeInput(input)
    .then((normalizedInput) =>
      Survivor.transaction(async (trx) =>
        Survivor.query(trx).upsertGraph(normalizedInput, { relate: true })))
    .then((user) => reply.code(201).send(user))
    .catch((error) => {
      if (error instanceof UnknownItemsError || error instanceof InvalidItemQuantityError || error instanceof MissingItemsError) {
        return reply.code(400).send({ message: error.message });
      }
      return reply.send(error);
    });
};

const normalizeInput = async (input: Input): Promise<TransformedInput> => {
  return {
    ...input,
    name: normalizeName(input.name),
    gender: normalizeGender(input.gender),
    items: await normalizeItems(input.items)
  };
};

const normalizeName = (name: Input['name']) =>
  name?.trim();

const normalizeGender = (gender: Input['gender']) =>
  gender?.toLowerCase() as Gender;

const normalizeItems = async (items: Input['items']) => {
  if (!items || items.length === 0) {
    throw new MissingItemsError();
  }

  const itemNames = items!.map(item => item.name);
  const existingItems = await TradeItem.query()
    .whereIn('name', itemNames)
    .select('id', 'name');

  const existingByName = Object.fromEntries(
    existingItems.map(i => [i.name, i.id])
  );

  const unknownItems = items!.filter(item => !existingByName[item.name]).map(item => item.name);
  if (unknownItems.length > 0) {
    throw new UnknownItemsError(unknownItems);
  }

  const normalizeItems = items!.map(item => ({
    id: existingByName[item.name]!,
    quantity: item.quantity,
  }));

  const invalidQuantities = items.filter(item => existingByName[item.name] && item.quantity <= 0);
  if (invalidQuantities.length > 0) {
    throw new InvalidItemQuantityError(invalidQuantities);
  }

  return normalizeItems;
};
