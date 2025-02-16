import { FastifyReply, FastifyRequest } from 'fastify';
import { ForeignKeyViolationError, NotFoundError } from 'objection';
import { RequiredFieldError, SelfReportError } from 'src/actions/errors';
import { Survivor } from 'src/models';

export type Input = {
  reporterId: number;
  notes?: string;
};

type Request = FastifyRequest<{ Body: Input, Params: { id: number } }>;

export default async (
  { body: input, params: { id } }: Request,
  reply: FastifyReply
) =>
  normalizeInput(input, id)
    .then((normalizedInput) =>
      Survivor.transaction(async (trx) =>
        Survivor
          .query(trx)
          .upsertGraph(
            { id, reportsReceived: normalizedInput },
            { relate: true, noUpdate: true, noDelete: true })
          .throwIfNotFound()))
    .then((survivor) => {
      reply.send({
        ...survivor,
        id: Number(survivor.id),
      });
    })
    .catch((error) => {
      if (error instanceof RequiredFieldError || error instanceof SelfReportError) {
        return reply.status(400).send({ message: error.message });
      }
      if (error instanceof NotFoundError) {
        return reply.status(404).send({ message: 'Survivor not found' });
      }
      if (error instanceof ForeignKeyViolationError) {
        return reply.status(400).send({ message: `invalid reporterId: ${id}` });
      }
      return reply.send(error);
    });

const normalizeInput = async (input: Input, reportedId: number) => {
  if (input.reporterId === undefined) {
    throw new RequiredFieldError('reporterId');
  }

  if (Number(input.reporterId) === Number(reportedId)) {
    throw new SelfReportError(input.reporterId);
  }

  return [{
    id: Number(input.reporterId),
    notes: input.notes!,
  }];
};
