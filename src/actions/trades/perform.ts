import { FastifyReply, FastifyRequest } from 'fastify';
import { InsuficintInventoryError, TradeItemsNotFoundError, TradeValueMismatchError } from 'src/actions/errors';
import { Survivor, TradeItem } from 'src/models';
import Objection from 'objection';

type SurvivorInput = {
  id: number;
  items: { id: number; quantity: number }[];
};

export type Input = {
  survivor1: SurvivorInput;
  survivor2: SurvivorInput;
};

type Request = FastifyRequest<{ Body: Input }>;

export default async (
  { body: input }: Request,
  reply: FastifyReply
) => {
  return validateOfferedItemsExist(input)
    .then((input) => validateItemsOwnership(input))
    .then(({ survivor1, survivor2 }) => validatePointsMatch(survivor1, survivor2))
    .then(({ survivor1, survivor2 }) => performTrade(survivor1, survivor2))
    .then(() => reply.send({ message: 'trade successful' }))
    .catch((error) => {
      if (error instanceof TradeValueMismatchError || error instanceof InsuficintInventoryError || error instanceof TradeItemsNotFoundError) {
        return reply.status(400).send({ message: error.message });
      }
      return reply.send(error);
    });
};

const validateOfferedItemsExist = async (input: Input) => {
  await Promise.all([
    validateOfferedItemsExistForUser(input.survivor1),
    validateOfferedItemsExistForUser(input.survivor2)
  ]);
  return input;
};

const validateOfferedItemsExistForUser = async (survivor: SurvivorInput) => {
  const ids = survivor.items.map(item => item.id);
  const tradeItems = await TradeItem.query()
    .whereIn('id', ids)
    .orderBy('id');

  if (tradeItems.length !== survivor.items.length) {
    const foundIds = tradeItems.map(t => t.id);
    const missingIds = survivor.items.filter(item => !foundIds.includes(item.id)).map(item => item.id);
    throw new TradeItemsNotFoundError(missingIds);
  }
};

const validateItemsOwnership = async (input: Input) => {
  const survivor1 = await validateItemsOwnershipForUser(input.survivor1);
  const survivor2 = await validateItemsOwnershipForUser(input.survivor2);

  return { survivor1, survivor2 };
};

export const validatePointsMatch = async (
  survivor1: SurvivorInput,
  survivor2: SurvivorInput
): Promise<{ survivor1: SurvivorInput; survivor2: SurvivorInput }> => {
  const totalPoints1 = await computeTotalPoints(survivor1);
  const totalPoints2 = await computeTotalPoints(survivor2);
  if (totalPoints1 !== totalPoints2) {
    throw new TradeValueMismatchError(
      { id: survivor1.id, offered: totalPoints1 },
      { id: survivor2.id, offered: totalPoints2 }
    );
  }
  return { survivor1, survivor2 };
};

const performTrade = async (survivor1: SurvivorInput, survivor2: SurvivorInput) => {
  await Survivor.transaction(async (trx) => {
    await transferItems(survivor1, survivor2, trx);
    await transferItems(survivor2, survivor1, trx);
  });
};

const validateItemsOwnershipForUser = async (
  input: SurvivorInput,
) => {
  const survivor = await Survivor.query()
    .findById(input.id)
    .throwIfNotFound()
    .withGraphFetched('items');

  for (const offeredItem of input.items) {
    const owned = (survivor.items).find(item => item.id === offeredItem.id);
    const ownedQuantity = owned?.quantity || 0;

    if (ownedQuantity < offeredItem.quantity) {
      throw new InsuficintInventoryError({
        survivorId: input.id,
        itemId: offeredItem.id,
        offered: offeredItem.quantity,
        owned: ownedQuantity
      });
    }
  }

  return input;
};

const computeTotalPoints = async (survivor: SurvivorInput): Promise<number> => {
  const ids = survivor.items.map(item => item.id);
  const tradeItems = await TradeItem.query()
    .whereIn('id', ids)
    .orderBy('id');

  return survivor.items.reduce((total, item) => {
    const tradeItem = tradeItems.find(t => t.id === item.id)!;
    return total + tradeItem.points * item.quantity;
  }, 0);
};

const transferItems = async (
  source: SurvivorInput,
  destination: SurvivorInput,
  trx: Objection.Transaction
): Promise<void> => {
  for (const item of source.items) {
    await trx('ownership')
      .where({ survivor_id: source.id, item_id: item.id })
      .decrement('quantity', item.quantity);

    const exists = await trx('ownership')
      .where({ survivor_id: destination.id, item_id: item.id })
      .first();

    if (exists) {
      await trx('ownership')
        .where({ survivor_id: destination.id, item_id: item.id })
        .increment('quantity', item.quantity);
    } else {
      await trx('ownership').insert({
        survivor_id: destination.id,
        item_id: item.id,
        quantity: item.quantity,
      });
    }
  }
};
