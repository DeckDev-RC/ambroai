import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../config/env";

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1, "Usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { username, password } = parsed.data;

    // Check username
    if (username !== env.AUTH_USER) {
      res.status(401).json({ success: false, error: "Usuário ou senha incorretos" });
      return;
    }

    // Check password (bcrypt)
    const passwordValid = await bcrypt.compare(password, env.AUTH_PASSWORD);
    if (!passwordValid) {
      res.status(401).json({ success: false, error: "Usuário ou senha incorretos" });
      return;
    }

    // Generate JWT
    const token = jwt.sign({ user: username }, env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.json({
      success: true,
      data: {
        token,
        user: username,
        expiresIn: "24h",
      },
    });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ success: false, error: "Erro interno do servidor" });
  }
});

router.get("/me", (req: Request, res: Response) => {
  // This route is protected by authMiddleware applied in server.ts
  res.json({
    success: true,
    data: { user: req.user?.user },
  });
});

export default router;
