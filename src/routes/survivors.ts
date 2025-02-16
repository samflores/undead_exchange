import { FastifyInstance } from 'fastify';
import createAction from '../actions/survivors/create';
import updateAction from '../actions/survivors/update';

export default async (server: FastifyInstance) => {
  server.post('/', createAction);
  server.patch('/:id', updateAction);
};
