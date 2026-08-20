import { Request, Response, NextFunction } from 'express';
import { registerCustomer, loginUser } from '../services/authService.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await registerCustomer(req.body);

    res.cookie('token', result.token, COOKIE_OPTIONS);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await loginUser(req.body);

    res.cookie('token', result.token, COOKIE_OPTIONS);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { message: 'Not authenticated', statusCode: 401 },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: req.user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(
  _req: Request,
  res: Response
): Promise<void> {
  res.clearCookie('token', COOKIE_OPTIONS);
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
}
