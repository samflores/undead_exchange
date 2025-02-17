import { FastifyInstance } from 'fastify';
import performAction from '../actions/trades/perform';

export default async (server: FastifyInstance) => {
  server.post('/', performAction);
};
