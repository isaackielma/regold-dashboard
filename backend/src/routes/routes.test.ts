import request from 'supertest';
import app from '../index';

// These tests hit the Express router layer.
// They use a real running app but mock the DB-calling services.

jest.mock('../services/authService', () => ({
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/,
  register: jest.fn().mockResolvedValue({ message: 'Registration successful. Please check your email to verify your account.' }),
  verifyEmail: jest.fn().mockResolvedValue({ message: 'Email verified successfully. You may now log in.' }),
  login: jest.fn().mockResolvedValue({
    token: 'mock.jwt.token',
    investor: { id: 'abc', email: 'test@example.com', firstName: 'Test', lastName: 'User', role: 'investor' },
  }),
}));

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('POST /api/auth/register', () => {
  it('returns 201 on valid input', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'investor@example.com',
        password: 'Secure#99',
        firstName: 'Jean',
        lastName: 'Dupont',
        entityType: 'family_office',
        countryCode: 'FR',
        jurisdiction: 'France',
      });
    expect(res.status).toBe(201);
    expect(res.body.message).toContain('verify your email');
  });

  it('returns 422 when email is invalid', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'Secure#99', firstName: 'A', lastName: 'B', entityType: 'individual', countryCode: 'FR', jurisdiction: 'France' });
    expect(res.status).toBe(422);
  });

  it('returns 422 when password is too weak', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'a@b.com', password: 'weak', firstName: 'A', lastName: 'B', entityType: 'individual', countryCode: 'FR', jurisdiction: 'France' });
    expect(res.status).toBe(422);
  });
});

describe('POST /api/auth/login', () => {
  it('returns token on valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'investor@example.com', password: 'Secure#99' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });
});

describe('Protected routes without token', () => {
  it('GET /api/holdings returns 401', async () => {
    const res = await request(app).get('/api/holdings');
    expect(res.status).toBe(401);
  });

  it('GET /api/esg returns 401', async () => {
    const res = await request(app).get('/api/esg');
    expect(res.status).toBe(401);
  });

  it('GET /api/tax-lots returns 401', async () => {
    const res = await request(app).get('/api/tax-lots');
    expect(res.status).toBe(401);
  });
});
