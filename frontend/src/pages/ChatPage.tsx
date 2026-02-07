import { useState, useRef, useEffect, useCallback } from "react";
import { api } from "../services/api";
import { ChatMessage } from "../components/ChatMessage";
import { ChatInput } from "../components/ChatInput";
import { ConversationSidebar } from "../components/ConversationSidebar";
import { Bot, LogOut, Trash2, Menu } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface ChatPageProps {
  onLogout: () => void;
}

interface Conversation {
  id: string;
  messages: Array<{ role: string; content: string; timestamp: string }>;
  created_at: string;
  updated_at: string;
}

export function ChatPage({ onLogout }: ChatPageProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const user = api.getUser();

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load all conversations on mount
  const loadConversations = useCallback(async (autoSelectFirst = false) => {
    const result = await api.getChatHistory();
    if (result.success && result.data) {
      setConversations(result.data);
      // Only auto-select on initial mount, not after delete
      if (autoSelectFirst && result.data.length > 0 && !conversationId) {
        const latest = result.data[0];
        setConversationId(latest.id);
        setMessages(
          latest.messages.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
            timestamp: m.timestamp,
          }))
        );
      }
    }
  }, [conversationId]);

  useEffect(() => {
    loadConversations(true); // Auto-select on mount only
  }, []);

  const handleSend = async (message: string) => {
    const userMsg: Message = {
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    const result = await api.sendMessage(message, conversationId || undefined);

    if (result.success && result.data) {
      setConversationId(result.data.conversation_id);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: result.data!.message,
          timestamp: new Date().toISOString(),
        },
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: result.error || "Erro ao processar mensagem. Tente novamente.",
          timestamp: new Date().toISOString(),
        },
      ]);
    }

    setLoading(false);
  };

  const handleNewChat = async () => {
    const result = await api.newConversation();
    if (result.success && result.data) {
      setConversationId(result.data.id);
      setMessages([]);
      loadConversations();
    }
  };

  const handleSelectConversation = (conv: Conversation) => {
    setConversationId(conv.id);
    setMessages(
      conv.messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
        timestamp: m.timestamp,
      }))
    );
  };

  const handleDeleteConversation = async (id: string) => {
    await api.clearConversation(id);
    if (id === conversationId) {
      setConversationId(null);
      setMessages([]);
    }
    loadConversations();
  };

  const handleClear = async () => {
    if (conversationId) {
      await api.clearConversation(conversationId);
      setMessages([]);
    }
  };

  const handleLogout = () => {
    api.logout();
    onLogout();
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        background: "var(--bg-primary)",
      }}
    >
      {/* Mobile Backdrop */}
      {isMobile && sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      {(!isMobile || sidebarOpen) && (
        <div className={isMobile ? "sidebar-mobile-overlay" : ""}>
          <ConversationSidebar
            conversations={conversations}
            currentId={conversationId}
            onSelect={(conv) => {
              handleSelectConversation(conv);
              if (isMobile) setSidebarOpen(false);
            }}
            onDelete={handleDeleteConversation}
            onNewChat={() => {
              handleNewChat();
              if (isMobile) setSidebarOpen(false);
            }}
          />
        </div>
      )}

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        {/* Header */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: isMobile ? "12px 16px" : "12px 24px",
            borderBottom: "1px solid var(--border)",
            background: "var(--bg-secondary)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Mobile hamburger menu */}
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{
                  padding: "8px",
                  background: "var(--bg-tertiary)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Menu size={20} />
              </button>
            )}
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #6366F1, #4F46E5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bot size={20} color="white" />
            </div>
            <div>
              <h1
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  lineHeight: 1.2,
                }}
              >
                Ambro
              </h1>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--text-muted)",
                }}
              >
                Agente IA · E-commerce Analytics
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>

            {messages.length > 0 && (
              <button
                onClick={handleClear}
                title="Limpar conversa"
                style={{
                  padding: "8px",
                  background: "var(--bg-tertiary)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  transition: "all var(--transition)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget.style.borderColor = "var(--danger)");
                  (e.currentTarget.style.color = "var(--danger)");
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget.style.borderColor = "var(--border)");
                  (e.currentTarget.style.color = "var(--text-secondary)");
                }}
              >
                <Trash2 size={16} />
              </button>
            )}

            <div
              style={{
                width: "1px",
                height: "24px",
                background: "var(--border)",
                margin: "0 4px",
              }}
            />

            <button
              onClick={handleLogout}
              title="Sair"
              style={{
                padding: "8px",
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-secondary)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
                fontFamily: "var(--font-sans)",
                transition: "all var(--transition)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget.style.borderColor = "var(--text-secondary)");
              }}
              onMouseLeave={(e) => {
                (e.currentTarget.style.borderColor = "var(--border)");
              }}
            >
              <LogOut size={16} />
              <span>{user}</span>
            </button>
          </div>
        </header>

        {/* Messages Area */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {messages.length === 0 ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px 24px",
                gap: "24px",
              }}
            >
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "20px",
                  background: "linear-gradient(135deg, #6366F1, #4F46E5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 12px 40px rgba(99, 102, 241, 0.25)",
                }}
              >
                <Bot size={36} color="white" />
              </div>

              <div style={{ textAlign: "center" }}>
                <h2
                  style={{
                    fontSize: "22px",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    marginBottom: "8px",
                  }}
                >
                  Olá! Eu sou o Ambro 👋
                </h2>
                <p
                  style={{
                    fontSize: "15px",
                    color: "var(--text-secondary)",
                    maxWidth: "480px",
                    lineHeight: 1.6,
                  }}
                >
                  Sou seu assistente de análise de dados. Pergunte sobre pedidos,
                  vendas, faturamento e marketplaces.
                </p>
              </div>

              {/* Suggestion chips */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  justifyContent: "center",
                  maxWidth: "600px",
                }}
              >
                {[
                  "Quantos pedidos pagos em dezembro/2025?",
                  "Valor total de vendas do Bagy?",
                  "Média de ticket dos últimos 90 dias?",
                  "Vendas por marketplace este mês?",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSend(suggestion)}
                    style={{
                      padding: "10px 16px",
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-full)",
                      color: "var(--text-secondary)",
                      fontSize: "13px",
                      fontFamily: "var(--font-sans)",
                      cursor: "pointer",
                      transition: "all var(--transition)",
                      whiteSpace: "nowrap",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget.style.borderColor = "var(--accent)");
                      (e.currentTarget.style.color = "var(--accent)");
                      (e.currentTarget.style.background = "var(--accent-glow)");
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget.style.borderColor = "var(--border)");
                      (e.currentTarget.style.color = "var(--text-secondary)");
                      (e.currentTarget.style.background = "var(--bg-secondary)");
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ maxWidth: "800px", width: "100%", margin: "0 auto" }}>
              {messages.map((msg, i) => (
                <ChatMessage
                  key={i}
                  role={msg.role}
                  content={msg.content}
                  timestamp={msg.timestamp}
                />
              ))}
              {loading && (
                <ChatMessage role="assistant" content="" isLoading />
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <ChatInput onSend={handleSend} disabled={loading} />
      </div>
    </div>
  );
}
