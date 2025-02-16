import { FastifyInstance } from 'fastify';
import createAction from '../actions/survivors/create';
import updateAction from '../actions/survivors/update';
import reportInfectionAction from '../actions/survivors/report_infection';

export default async (server: FastifyInstance) => {
  server.post('/', createAction);
  server.patch('/:id', updateAction);
  server.post('/:id/infection-reports', reportInfectionAction);
};
