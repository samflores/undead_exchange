import fastify from 'fastify';

const shouldLog = process.env.NODE_ENV !== 'test';
const server = fastify({ logger: shouldLog });

server.get('/ping', async () => {
  return 'pong';
});

export default server;
