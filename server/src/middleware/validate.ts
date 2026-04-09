import { z, ZodError } from "zod";
import type { Request, Response, NextFunction } from 'express';

export const validate = (schema: z.ZodType) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation Error',
          errors: error.issues.map((err) => ({
            path: err.path.length > 1 ? err.path.slice(1).join('.') : err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };