import type {Request, Response, NextFunction} from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { AppError } from './errorHandler';

export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.header('authorization');


  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError("No Tokens Provided", 401));
  }
  const token = authHeader.split(' ')[1];

  try{
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  }catch(error){
    return next(new AppError("Invalid token", 401));
  }
};

export const verifyAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || req.user.role !== 'ADMIN'){
    return next(new AppError("Admin access required", 403));
  }
  next();
};