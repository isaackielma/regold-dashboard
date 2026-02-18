import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db/pool';
import { AppError } from '../middleware/errorHandler';
import { LoginResponse, JwtPayload, EntityType } from '../types/domain';
import { sendVerificationEmail } from './emailService';

const SALT_ROUNDS = 12;

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  entityType: EntityType;
  countryCode: string;
  jurisdiction: string;
}

// Password rules: ≥8 chars, uppercase, lowercase, digit, special char
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;

export async function register(input: RegisterInput): Promise<{ message: string }> {
  const { email, password, firstName, lastName, entityType, countryCode, jurisdiction } = input;

  const existing = await pool.query('SELECT id FROM investors WHERE email = $1', [email.toLowerCase()]);
  if (existing.rowCount && existing.rowCount > 0) {
    throw new AppError(409, 'An account with this email already exists');
  }

  if (!PASSWORD_REGEX.test(password)) {
    throw new AppError(400, 'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character (!@#$%^&*)');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const investorId = uuidv4();

  await pool.query(
    `INSERT INTO investors
       (id, email, password_hash, first_name, last_name, entity_type, country_code, jurisdiction, email_verification_token)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [investorId, email.toLowerCase(), passwordHash, firstName, lastName, entityType, countryCode, jurisdiction, verificationToken],
  );

  // Fire-and-forget — don't block registration if email delivery fails
  sendVerificationEmail(email, verificationToken).catch(() => null);

  return { message: 'Registration successful. Please check your email to verify your account.' };
}

export async function verifyEmail(token: string): Promise<{ message: string }> {
  const result = await pool.query(
    `UPDATE investors
     SET email_verified = true, email_verification_token = NULL
     WHERE email_verification_token = $1
     RETURNING id`,
    [token],
  );

  if (!result.rowCount) {
    throw new AppError(400, 'Invalid or expired verification token');
  }

  return { message: 'Email verified successfully. You may now log in.' };
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const result = await pool.query(
    `SELECT id, email, password_hash, first_name, last_name, role, email_verified, kyc_status
     FROM investors WHERE email = $1`,
    [email.toLowerCase()],
  );

  if (!result.rowCount) {
    // Same error as wrong password to prevent email enumeration
    throw new AppError(401, 'Invalid email or password');
  }

  const row = result.rows[0];
  const valid = await bcrypt.compare(password, row.password_hash);
  if (!valid) {
    throw new AppError(401, 'Invalid email or password');
  }

  if (!row.email_verified) {
    throw new AppError(403, 'Please verify your email before logging in');
  }

const payload: JwtPayload = { sub: row.id, email: row.email, role: row.role };
const secret = process.env.JWT_SECRET as string;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const token = (jwt.sign as any)(payload, secret, { expiresIn: '7d' });

  await pool.query('UPDATE investors SET last_login = NOW() WHERE id = $1', [row.id]);

  return {
    token,
    investor: {
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      role: row.role,
    },
  };
}
