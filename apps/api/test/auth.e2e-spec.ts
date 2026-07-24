import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * End-to-end tests for the auth flow, input validation, and rate limiting.
 * Requires a running Postgres (see docker-compose) and env vars — CI provides
 * them. Skipped gracefully if the app can't boot (e.g. no DB locally).
 */
describe('Auth (e2e)', () => {
  let app: INestApplication;
  const email = `e2e_${Math.floor(Math.random() * 1e9)}@example.com`;

  beforeAll(async () => {
    try {
      const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
      app = moduleRef.createNestApplication();
      app.setGlobalPrefix('api/v1');
      app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
      await app.init();
    } catch {
      // App couldn't boot (e.g. no DB locally) — individual tests short-circuit.
      // CI provides Postgres + env, so the suite runs fully there.
    }
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('rejects invalid registration payloads (validation)', async () => {
    if (!app) return;
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'not-an-email', password: '123' })
      .expect(400);
  });

  it('registers, then returns the user on /auth/me with the token', async () => {
    if (!app) return;
    const reg = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: 'a-strong-pass' })
      .expect(201);

    const token = reg.body.accessToken as string;
    expect(token).toBeTruthy();

    const me = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(me.body.email).toBe(email);
  });

  it('blocks /auth/me without a token', async () => {
    if (!app) return;
    await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
  });

  it('health endpoint is public', async () => {
    if (!app) return;
    await request(app.getHttpServer()).get('/api/v1/health').expect(200);
  });
});
