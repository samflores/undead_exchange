import fastify from 'fastify';
import survivors from './routes/survivors';

const shouldLog = process.env.NODE_ENV !== 'test';
const server = fastify({ logger: shouldLog });

server.register(survivors, { prefix: '/survivors' });

export default server;
