import { Router, Request, Response } from "express";
import { z } from "zod";
import { processMessage } from "../services/agent";
import {
  getOrCreateConversation,
  addMessage,
  getConversationHistory,
  clearConversation,
  startNewConversation,
} from "../services/conversation";
import { ChatMessage } from "../types";

const router = Router();

// ── POST /api/chat/message ──────────────────────────────
const messageSchema = z.object({
  message: z.string().min(1).max(2000),
  conversation_id: z.string().uuid().optional(),
});

router.post("/message", async (req: Request, res: Response) => {
  try {
    const parsed = messageSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: "Mensagem inválida",
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const userId = req.user!.user;
    const { message } = parsed.data;

    // Get or create conversation
    const conversation = parsed.data.conversation_id
      ? { id: parsed.data.conversation_id, messages: [] as ChatMessage[], user_id: userId, created_at: "", updated_at: "" }
      : await getOrCreateConversation(userId);

    // Fetch full conversation if ID was provided
    let history: ChatMessage[] = conversation.messages || [];
    if (parsed.data.conversation_id) {
      const convos = await getConversationHistory(userId);
      const found = convos.find((c) => c.id === parsed.data.conversation_id);
      if (found) history = found.messages;
    }

    // Save user message
    const userMsg: ChatMessage = {
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };
    await addMessage(conversation.id, userMsg);

    // Process with AI agent
    const aiResponse = await processMessage(message, history);

    // Save assistant message
    const assistantMsg: ChatMessage = {
      role: "assistant",
      content: aiResponse,
      timestamp: new Date().toISOString(),
    };
    await addMessage(conversation.id, assistantMsg);

    res.json({
      success: true,
      data: {
        message: aiResponse,
        conversation_id: conversation.id,
      },
    });
  } catch (error) {
    console.error("Erro no chat:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao processar mensagem. Tente novamente.",
    });
  }
});

// ── GET /api/chat/history ───────────────────────────────
router.get("/history", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.user;
    const conversations = await getConversationHistory(userId);

    res.json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    console.error("Erro ao buscar histórico:", error);
    res.status(500).json({ success: false, error: "Erro ao buscar histórico" });
  }
});

// ── POST /api/chat/new ──────────────────────────────────
router.post("/new", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.user;
    const conversation = await startNewConversation(userId);

    res.json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error("Erro ao criar conversa:", error);
    res.status(500).json({ success: false, error: "Erro ao criar nova conversa" });
  }
});

// ── DELETE /api/chat/:id ────────────────────────────────
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.user;
    const conversationId = req.params.id;

    await clearConversation(conversationId, userId);

    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao limpar conversa:", error);
    res.status(500).json({ success: false, error: "Erro ao limpar conversa" });
  }
});

export default router;
