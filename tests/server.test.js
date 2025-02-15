import { describe, it, expect } from 'vitest';
import server from '../src/server';

describe('Ping', () => {
  it('pongs', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/ping'
    });
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual('pong');
  });
});
