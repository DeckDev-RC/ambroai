import { useState } from "react";
import { MessageSquare, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

interface Conversation {
    id: string;
    messages: Array<{ role: string; content: string; timestamp: string }>;
    created_at: string;
    updated_at: string;
}

interface ConversationSidebarProps {
    conversations: Conversation[];
    currentId: string | null;
    onSelect: (conversation: Conversation) => void;
    onDelete: (id: string) => void;
    onNewChat: () => void;
}

export function ConversationSidebar({
    conversations,
    currentId,
    onSelect,
    onDelete,
    onNewChat,
}: ConversationSidebarProps) {
    const [collapsed, setCollapsed] = useState(false);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor(
            (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 0) return "Hoje";
        if (diffDays === 1) return "Ontem";
        if (diffDays < 7) return `${diffDays} dias atrás`;
        return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
    };

    const getPreview = (conv: Conversation) => {
        const firstUserMsg = conv.messages.find((m) => m.role === "user");
        if (!firstUserMsg) return "Nova conversa";
        const text = firstUserMsg.content;
        return text.length > 40 ? text.slice(0, 40) + "..." : text;
    };

    if (collapsed) {
        return (
            <div
                style={{
                    width: "48px",
                    background: "var(--bg-secondary)",
                    borderRight: "1px solid var(--border)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "12px 0",
                    gap: "8px",
                }}
            >
                <button
                    onClick={() => setCollapsed(false)}
                    title="Expandir histórico"
                    style={{
                        width: "36px",
                        height: "36px",
                        background: "var(--bg-tertiary)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-sm)",
                        color: "var(--text-secondary)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all var(--transition)",
                    }}
                >
                    <ChevronRight size={18} />
                </button>
            </div>
        );
    }

    return (
        <div
            style={{
                width: "280px",
                background: "var(--bg-secondary)",
                borderRight: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                height: "100%",
                flexShrink: 0,
            }}
        >
            {/* Header */}
            <div
                style={{
                    padding: "12px",
                    borderBottom: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <span
                    style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "var(--text-secondary)",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                    }}
                >
                    Histórico
                </span>
                <button
                    onClick={() => setCollapsed(true)}
                    title="Recolher"
                    style={{
                        padding: "4px",
                        background: "transparent",
                        border: "none",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        borderRadius: "var(--radius-sm)",
                        transition: "all var(--transition)",
                    }}
                >
                    <ChevronLeft size={18} />
                </button>
            </div>

            {/* New Chat Button */}
            <div style={{ padding: "12px" }}>
                <button
                    onClick={onNewChat}
                    style={{
                        width: "100%",
                        padding: "10px 12px",
                        background: "linear-gradient(135deg, #6366F1, #4F46E5)",
                        border: "none",
                        borderRadius: "var(--radius-sm)",
                        color: "white",
                        fontSize: "13px",
                        fontWeight: 500,
                        fontFamily: "var(--font-sans)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        transition: "all var(--transition)",
                    }}
                >
                    <MessageSquare size={16} />
                    Nova Conversa
                </button>
            </div>

            {/* Conversations List */}
            <div
                style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "0 8px 12px",
                }}
            >
                {conversations.length === 0 ? (
                    <div
                        style={{
                            padding: "24px 12px",
                            textAlign: "center",
                            color: "var(--text-muted)",
                            fontSize: "13px",
                        }}
                    >
                        Nenhuma conversa ainda
                    </div>
                ) : (
                    conversations.map((conv) => {
                        const isActive = conv.id === currentId;
                        return (
                            <div
                                key={conv.id}
                                onClick={() => onSelect(conv)}
                                style={{
                                    padding: "10px 12px",
                                    marginBottom: "4px",
                                    background: isActive ? "var(--accent-glow)" : "transparent",
                                    border: isActive
                                        ? "1px solid var(--accent)"
                                        : "1px solid transparent",
                                    borderRadius: "var(--radius-sm)",
                                    cursor: "pointer",
                                    transition: "all var(--transition)",
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "10px",
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.background = "var(--bg-tertiary)";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.background = "transparent";
                                    }
                                }}
                            >
                                <div
                                    style={{
                                        width: "28px",
                                        height: "28px",
                                        borderRadius: "6px",
                                        background: isActive
                                            ? "var(--accent)"
                                            : "var(--bg-tertiary)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                    }}
                                >
                                    <MessageSquare
                                        size={14}
                                        color={isActive ? "white" : "var(--text-muted)"}
                                    />
                                </div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                        style={{
                                            fontSize: "13px",
                                            fontWeight: isActive ? 500 : 400,
                                            color: isActive
                                                ? "var(--text-primary)"
                                                : "var(--text-secondary)",
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            marginBottom: "2px",
                                        }}
                                    >
                                        {getPreview(conv)}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "11px",
                                            color: "var(--text-muted)",
                                        }}
                                    >
                                        {formatDate(conv.updated_at || conv.created_at)}
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(conv.id);
                                    }}
                                    title="Excluir conversa"
                                    style={{
                                        padding: "4px",
                                        background: "transparent",
                                        border: "none",
                                        color: "var(--text-muted)",
                                        cursor: "pointer",
                                        borderRadius: "var(--radius-sm)",
                                        opacity: 0.6,
                                        transition: "all var(--transition)",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.color = "var(--danger)";
                                        e.currentTarget.style.opacity = "1";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.color = "var(--text-muted)";
                                        e.currentTarget.style.opacity = "0.6";
                                    }}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
