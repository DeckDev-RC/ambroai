import { Bot, User, Zap } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useMemo } from "react";
import { extractCharts, AmbroChart } from "./AmbroChart";

interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUSD: number;
}

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  isLoading?: boolean;
  tokenUsage?: TokenUsage;
}

export function ChatMessage({ role, content, timestamp, isLoading, tokenUsage }: ChatMessageProps) {
  const isUser = role === "user";

  // Extract charts from content
  const { text: textContent, charts } = useMemo(() => extractCharts(content), [content]);

  // Split text by chart placeholders and render interleaved
  const renderContent = () => {
    if (charts.length === 0) {
      return <MarkdownBlock text={content} />;
    }

    // Split by %%CHART_N%% placeholders
    const parts = textContent.split(/(%%CHART_\d+%%)/);
    return (
      <>
        {parts.map((part, i) => {
          const chartMatch = part.match(/%%CHART_(\d+)%%/);
          if (chartMatch) {
            const chartIndex = parseInt(chartMatch[1]);
            return charts[chartIndex] ? (
              <AmbroChart key={`chart-${i}`} data={charts[chartIndex]} />
            ) : null;
          }
          if (part.trim()) {
            return <MarkdownBlock key={`text-${i}`} text={part} />;
          }
          return null;
        })}
      </>
    );
  };

  return (
    <div
      className="animate-in chat-message-row"
      style={{
        display: "flex",
        gap: "12px",
        padding: "20px 24px",
        alignItems: "flex-start",
        background: isUser ? "transparent" : "var(--bg-secondary)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* Avatar */}
      <div
        className="chat-avatar"
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "var(--radius-sm)",
          background: isUser
            ? "var(--bg-tertiary)"
            : "linear-gradient(135deg, #6366F1, #4F46E5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {isUser ? (
          <User size={16} color="var(--text-secondary)" />
        ) : (
          <Bot size={16} color="white" />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "6px",
          }}
        >
          <span
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: isUser ? "var(--text-secondary)" : "var(--accent)",
            }}
          >
            {isUser ? "Você" : "Ambro"}
          </span>
          {timestamp && (
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              {new Date(timestamp).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>

        {isLoading ? (
          <div style={{ display: "flex", gap: "4px", padding: "8px 0" }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "var(--accent)",
                  animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        ) : (
          <div
            style={{
              fontSize: "15px",
              lineHeight: 1.7,
              color: "var(--text-primary)",
              wordBreak: "break-word",
            }}
            className="message-content"
          >
            {renderContent()}

            {/* Discrete token usage display */}
            {tokenUsage && !isUser && (
              <div
                className="token-usage"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginTop: "12px",
                  paddingTop: "8px",
                  borderTop: "1px solid var(--border)",
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  opacity: 0.7,
                }}
              >
                <Zap size={10} />
                <span>
                  {tokenUsage.totalTokens.toLocaleString("pt-BR")} tokens
                </span>
                <span style={{ opacity: 0.5 }}>•</span>
                <span>
                  ~${tokenUsage.estimatedCostUSD < 0.01
                    ? tokenUsage.estimatedCostUSD.toFixed(4)
                    : tokenUsage.estimatedCostUSD.toFixed(3)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Markdown renderer ───────────────────────────────────
function MarkdownBlock({ text }: { text: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p style={{ margin: "0 0 12px 0" }}>{children}</p>,
        strong: ({ children }) => (
          <strong style={{ color: "var(--accent-hover)", fontWeight: 600 }}>{children}</strong>
        ),
        code: ({ children }) => (
          <code
            style={{
              background: "var(--bg-tertiary)",
              padding: "2px 6px",
              borderRadius: "4px",
              fontSize: "13px",
              fontFamily: "var(--font-mono)",
              color: "var(--success)",
            }}
          >
            {children}
          </code>
        ),
        pre: ({ children }) => (
          <pre
            style={{
              background: "var(--bg-tertiary)",
              padding: "16px",
              borderRadius: "8px",
              overflow: "auto",
              margin: "12px 0",
              fontSize: "13px",
              fontFamily: "var(--font-mono)",
              border: "1px solid var(--border)",
            }}
          >
            {children}
          </pre>
        ),
        ul: ({ children }) => (
          <ul style={{ margin: "8px 0", paddingLeft: "20px", listStyle: "disc" }}>{children}</ul>
        ),
        ol: ({ children }) => <ol style={{ margin: "8px 0", paddingLeft: "20px" }}>{children}</ol>,
        li: ({ children }) => <li style={{ marginBottom: "4px" }}>{children}</li>,
        h1: ({ children }) => (
          <h1
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: "16px 0 8px 0",
              borderBottom: "1px solid var(--border)",
              paddingBottom: "8px",
            }}
          >
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 style={{ fontSize: "17px", fontWeight: 600, color: "var(--text-primary)", margin: "14px 0 6px 0" }}>
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--accent)", margin: "12px 0 4px 0" }}>
            {children}
          </h3>
        ),
        hr: () => <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "16px 0" }} />,
        blockquote: ({ children }) => (
          <blockquote
            style={{
              borderLeft: "3px solid var(--accent)",
              paddingLeft: "16px",
              margin: "12px 0",
              color: "var(--text-secondary)",
              fontStyle: "italic",
            }}
          >
            {children}
          </blockquote>
        ),
        table: ({ children }) => (
          <div
            style={{
              overflowX: "auto",
              margin: "12px 0",
              borderRadius: "8px",
              border: "1px solid var(--border)",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: "400px" }}>
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead style={{ background: "var(--bg-tertiary)", borderBottom: "2px solid var(--accent)" }}>
            {children}
          </thead>
        ),
        tbody: ({ children }) => <tbody>{children}</tbody>,
        tr: ({ children }) => <tr style={{ borderBottom: "1px solid var(--border)" }}>{children}</tr>,
        th: ({ children }) => (
          <th
            style={{
              padding: "10px 14px",
              textAlign: "left",
              fontWeight: 600,
              color: "var(--accent)",
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              whiteSpace: "nowrap",
            }}
          >
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td style={{ padding: "9px 14px", color: "var(--text-primary)", whiteSpace: "nowrap" }}>{children}</td>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
}
