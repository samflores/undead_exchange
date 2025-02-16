import { ExtraFieldsError, RequiredFieldError } from 'src/actions/errors';
import { FastifyReply, FastifyRequest } from 'fastify';
import { NotFoundError } from 'objection';
import { Survivor } from 'src/models';

type Input = {
  latitude: number;
  longitude: number;
};

type Request = FastifyRequest<{ Body: Input, Params: { id: number } }>;

export default async (
  { body: input, params: { id } }: Request,
  reply: FastifyReply
) =>
  normalizeInput(input)
    .then((normalizedInput) =>
      Survivor.query()
        .patchAndFetchById(id, normalizedInput)
        .throwIfNotFound())
    .then((survivor) => reply.send(survivor))
    .catch((error) => {
      if (error instanceof RequiredFieldError || error instanceof ExtraFieldsError) {
        return reply.status(400).send({ message: error.message });
      }
      if (error instanceof NotFoundError) {
        return reply.status(404).send({ message: 'Survivor not found' });
      }
      return reply.send(error);
    });

const normalizeInput = async (input: Input) => {
  if (input.latitude === undefined) {
    throw new RequiredFieldError('latitude');
  }
  if (input.longitude === undefined) {
    throw new RequiredFieldError('longitude');
  }

  const extraKeys = Object.keys(input).filter(key => !['latitude', 'longitude'].includes(key));
  if (extraKeys.length > 0) {
    throw new ExtraFieldsError(extraKeys);
  }

  return input;
};
