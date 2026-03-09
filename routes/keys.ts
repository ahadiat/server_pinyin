import express from "express";
import type { Request, Response } from "express";
import { supabase } from "../supabase.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post(
  "/save-keys",
  requireAuth,
  async (req: Request, res: Response) => {

    const { geminiKey, openrouterKey } = req.body;
    const user = (req as any).user;

    const { error } = await supabase
      .from("user_api_keys")
      .upsert({
        user_id: user.id,
        gemini_key: geminiKey,
        openrouter_key: openrouterKey
      });

    if (error) {
      return res.status(500).json(error);
    }

    res.json({
      message: "Keys saved"
    });

  }
);

export default router;