import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../../utils/asyncHandler';
import * as authService from './auth.service';
import type { RegisterInput, LoginInput } from './auth.validator';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.registerUser(req.body as RegisterInput);
  return res.status(StatusCodes.CREATED).json({
    success: true,
    message: 'Account created successfully',
    data: { user },
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.loginUser(req.body as LoginInput);
  res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);
  return res.status(StatusCodes.OK).json({
    success: true,
    message: 'Logged in successfully',
    data: {
      accessToken: result.accessToken,
      user: result.user,
    },
  });
});

export const adminLogin = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.loginAdmin(req.body as LoginInput);
  res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);
  return res.status(StatusCodes.OK).json({
    success: true,
    message: 'Admin logged in successfully',
    data: {
      accessToken: result.accessToken,
      user: result.user,
    },
  });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: 'No refresh token provided',
    });
  }

  const result = await authService.refreshAccessToken(token);
  return res.status(StatusCodes.OK).json({
    success: true,
    data: result,
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    await authService.logoutUser(token);
  }
  res.clearCookie('refreshToken', COOKIE_OPTIONS);
  return res.status(StatusCodes.OK).json({
    success: true,
    message: 'Logged out successfully',
  });
});