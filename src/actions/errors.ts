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
