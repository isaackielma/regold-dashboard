import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import * as authService from '../services/authService';

const router = Router();

const registerRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password')
    .matches(authService.PASSWORD_REGEX)
    .withMessage('Password must be ≥8 chars with uppercase, lowercase, digit, and special character (!@#$%^&*)'),
  body('firstName').trim().notEmpty().withMessage('First name required'),
  body('lastName').trim().notEmpty().withMessage('Last name required'),
  body('entityType')
    .isIn(['individual', 'family_office', 'institution', 'esg_fund'])
    .withMessage('Invalid entity type'),
  body('countryCode').isISO31661Alpha2().withMessage('Valid 2-letter country code required'),
  body('jurisdiction').trim().notEmpty().withMessage('Jurisdiction required'),
];

router.post('/register', registerRules, async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ errors: errors.array() });
    return;
  }

  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/verify-email', async (req: Request, res: Response, next: NextFunction) => {
  const token = req.query.token as string | undefined;
  if (!token) {
    res.status(400).json({ error: 'Verification token is required' });
    return;
  }

  try {
    const result = await authService.verifyEmail(token);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

const loginRules = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

router.post('/login', loginRules, async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ errors: errors.array() });
    return;
  }

  try {
    const result = await authService.login(req.body.email, req.body.password);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
