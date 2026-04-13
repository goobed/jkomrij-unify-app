const request = require('supertest');
const { createApp, buildContextFromQuery } = require('../src/app');

describe('unify playground app', () => {
  const app = createApp();

  test('buildContextFromQuery applies defaults', () => {
    expect(buildContextFromQuery({})).toEqual({
      email: 'anonymous@example.com',
      plan: 'free',
      region: 'unknown'
    });
  });

  test('GET /api/status returns context and flags', async () => {
    const response = await request(app)
      .get('/api/status?email=test@example.com&plan=pro&region=us')
      .expect(200);

    expect(response.body.ok).toBe(true);
    expect(response.body.inputs).toEqual({
      email: 'test@example.com',
      plan: 'pro',
      region: 'us'
    });
    expect(response.body.flags).toHaveProperty('showExcitedGreeting');
    expect(response.body.flags).toHaveProperty('releaseMessage');
  });

  test('GET / renders the landing page', async () => {
    const response = await request(app).get('/').expect(200);

    expect(response.text).toContain('CloudBees Unify Playground');
    expect(response.text).toContain('showExcitedGreeting');
  });
});
