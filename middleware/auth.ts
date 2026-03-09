import type { Request, Response, NextFunction } from "express";
import { supabase } from "../supabase.js";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {

  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({
      error: "Missing token"
    });
  }

  const {
    data: { user },
    error
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({
      error: "Invalid token"
    });
  }

  (req as any).user = user;

  next();
}