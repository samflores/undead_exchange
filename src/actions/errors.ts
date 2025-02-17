export class UnknownItemsError extends Error {
  constructor(itemsNames: string[]) {
    super(`unknown item${itemsNames.length == 1 ? '' : 's'}: ${itemsNames.join(', ')}`);
  }
}

export class MissingItemsError extends Error {
  constructor() {
    super('must provide at least one item');
  }
}

export class InvalidItemQuantityError extends Error {
  constructor(invalid: { name: string, quantity: number }[]) {
    super(`all quantities must be >= 0, got: ${invalid.map(i => `${i.quantity} for ${i.name}`).join(', ')}`);
  }
}

export class RequiredFieldError extends Error {
  constructor(field: string) {
    super(`${field} is required`);
  }
}

export class ExtraFieldsError extends Error {
  constructor(fields: string[]) {
    super(`unexpected fields: ${fields.join(', ')}`);
  }
}

export class SelfReportError extends Error {
  constructor(id: number) {
    super(`invalid reporterId: ${id}`);
  }
}
type InsufficientInventoryErrorArgs = { survivorId: number, itemId: number, offered: number, owned: number };

export class InsuficintInventoryError extends Error {
  constructor(
    { survivorId, itemId, offered, owned }: InsufficientInventoryErrorArgs
  ) {
    super(
      `survivor ${survivorId} does not have enough of item ${itemId} (requested ${offered}, owned ${owned})`
    );
  }
}

type SurvivorTotalOffer = { id: number, offered: number };

export class TradeValueMismatchError extends Error {
  constructor(survivor1: SurvivorTotalOffer, survivor2: SurvivorTotalOffer) {
    const msg1 = `survivor ${survivor1.id} total ${survivor1.offered}`;
    const msg2 = `survivor ${survivor2.id} total ${survivor2.offered}`;

    super(`trade points do not match: ${msg1}, ${msg2}`);
  }
}

export class TradeItemsNotFoundError extends Error {
  constructor(ids: number[]) {
    super(`trade items not found: ${ids.join(', ')}`);
  }
}
