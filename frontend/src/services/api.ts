const API_URL = import.meta.env.VITE_API_URL || "";

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem("ambro_token");
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (response.status === 401) {
        this.logout();
        window.location.reload();
      }

      return data;
    } catch (error) {
      console.error("API Error:", error);
      return { success: false, error: "Erro de conexão com o servidor" };
    }
  }

  // ── Auth ────────────────────────────────────────
  async login(username: string, password: string) {
    const result = await this.request<{
      token: string;
      user: string;
      expiresIn: string;
    }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    if (result.success && result.data?.token) {
      this.token = result.data.token;
      localStorage.setItem("ambro_token", result.data.token);
      localStorage.setItem("ambro_user", result.data.user);
    }

    return result;
  }

  logout() {
    this.token = null;
    localStorage.removeItem("ambro_token");
    localStorage.removeItem("ambro_user");
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getUser(): string | null {
    return localStorage.getItem("ambro_user");
  }

  // ── Chat ────────────────────────────────────────
  async sendMessage(message: string, conversationId?: string) {
    return this.request<{
      message: string;
      conversation_id: string;
      tokenUsage?: {
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
        estimatedCostUSD: number;
      };
    }>("/api/chat/message", {
      method: "POST",
      body: JSON.stringify({ message, conversation_id: conversationId }),
    });
  }

  async getChatHistory() {
    return this.request<
      Array<{
        id: string;
        messages: Array<{ role: string; content: string; timestamp: string }>;
        created_at: string;
        updated_at: string;
      }>
    >("/api/chat/history");
  }

  async newConversation() {
    return this.request<{ id: string }>("/api/chat/new", { method: "POST" });
  }

  async clearConversation(id: string) {
    return this.request(`/api/chat/${id}`, { method: "DELETE" });
  }

  // ── Health ──────────────────────────────────────
  async health() {
    return this.request<{ api: string; supabase: string; timestamp: string }>(
      "/api/health"
    );
  }
}

export const api = new ApiService();
