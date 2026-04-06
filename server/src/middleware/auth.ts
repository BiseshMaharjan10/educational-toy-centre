import type {Request, Response, NextFunction} from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { AppError } from './errorHandler';

export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeander = req.header('authorization');


  if (!authHeander || !authHeander.startsWith('Bearer ')) {
    return next(new AppError("No Tokens Provided", 401));
  }
  const token = authHeander.split('')[1];

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
  if (!req.user || req.user.role !== 'admin'){
    return next(new AppError("Admin access required", 403));
  }
  next();
};