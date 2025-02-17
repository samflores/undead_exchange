import fastify from 'fastify';
import survivors from './routes/survivors';
import trades from './routes/trades';

const shouldLog = process.env.NODE_ENV !== 'test';
const server = fastify({ logger: shouldLog });

server.register(survivors, { prefix: '/survivors' });
server.register(trades, { prefix: '/trades' });

export default server;
