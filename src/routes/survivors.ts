import { FastifyInstance } from 'fastify';
import createAction from '../actions/survivors/create';

export default async (server: FastifyInstance) => {
  server.post('/', createAction);
};
