import { ZodObject, ZodSchema, ZodError } from "zod";
import { Request, Response, NextFunction } from "express";
import { __ } from "../utils/i18n";

// Helper function to format Zod errors into user-friendly messages
const formatZodErrors = (error: ZodError) => {
  const formattedErrors: Record<string, string[]> = {};
  
  error.issues.forEach((err) => {
    const path = err.path.join('.');
    if (!formattedErrors[path]) {
      formattedErrors[path] = [];
    }
    formattedErrors[path].push(err.message);
  });
  
  return formattedErrors;
};

const validate =
  (schema: ZodObject) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      // Only validate the fields that are defined in the schema
      const dataToValidate: any = {};
      
      if (schema.shape.body) {
        dataToValidate.body = req.body;
      }
      if (schema.shape.query) {
        dataToValidate.query = req.query;
      }
      if (schema.shape.params) {
        dataToValidate.params = req.params;
      }
      
      schema.parse(dataToValidate);
      next();
    } catch (err: any) {
      if (err instanceof ZodError) {
        return res.status(400).json({ 
          success: false,
          message: __("validation.validation_failed"),
          errors: formatZodErrors(err),
          details: err.issues.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message,
            code: e.code
          }))
        });
      }
      
      return res.status(400).json({ 
        success: false,
        message: __("validation.validation_failed"),
        errors: err.errors || err.message
      });
    }
  };

export const validateBody =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (err: any) {
      if (err instanceof ZodError) {
        return res.status(400).json({ 
          success: false,
          message: __("validation.validation_failed"),
          errors: formatZodErrors(err),
          details: err.issues.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message,
            code: e.code
          }))
        });
      }
      
      return res.status(400).json({ 
        success: false,
        message: __("validation.validation_failed"),
        errors: err.errors || err.message
      });
    }
  };

export const validateQuery =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.query);
      // Store validated data in a custom property instead of overwriting req.query
      (req as any).validatedQuery = validatedData;
      next();
    } catch (err: any) {
      if (err instanceof ZodError) {
        return res.status(400).json({ 
          success: false,
          message: __("validation.validation_failed"),
          errors: formatZodErrors(err),
          details: err.issues.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message,
            code: e.code
          }))
        });
      }
      
      return res.status(400).json({ 
        success: false,
        message: __("validation.validation_failed"),
        errors: err.errors || err.message
      });
    }
  };

export const validateParams =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.params);
      // Store validated data in a custom property instead of overwriting req.params
      (req as any).validatedParams = validatedData;
      next();
    } catch (err: any) {
      if (err instanceof ZodError) {
        return res.status(400).json({ 
          success: false,
          message: __("validation.validation_failed"),
          errors: formatZodErrors(err),
          details: err.issues.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message,
            code: e.code
          }))
        });
      }
      
      return res.status(400).json({ 
        success: false,
        message: __("validation.validation_failed"),
        errors: err.errors || err.message
      });
    }
  };

export default validate;