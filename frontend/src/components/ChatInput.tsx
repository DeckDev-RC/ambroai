import { useState, useRef, type FormEvent, type KeyboardEvent } from "react";
import { SendHorizontal, Loader2 } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setMessage("");
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInput = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 160) + "px";
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        padding: "16px 24px 24px",
        background: "var(--bg-primary)",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "flex-end",
          maxWidth: "800px",
          margin: "0 auto",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          padding: "8px 8px 8px 16px",
          transition: "border-color var(--transition)",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
      >
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="Pergunte sobre seus dados... (ex: Quantos pedidos pagos em dezembro?)"
          disabled={disabled}
          rows={1}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "var(--text-primary)",
            fontSize: "15px",
            fontFamily: "var(--font-sans)",
            lineHeight: 1.5,
            resize: "none",
            maxHeight: "160px",
            padding: "8px 0",
          }}
        />

        <button
          type="submit"
          disabled={!message.trim() || disabled}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "var(--radius-sm)",
            background:
              !message.trim() || disabled
                ? "var(--bg-tertiary)"
                : "var(--accent)",
            border: "none",
            color: "white",
            cursor:
              !message.trim() || disabled ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "background var(--transition)",
          }}
        >
          {disabled ? (
            <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
          ) : (
            <SendHorizontal size={18} />
          )}
        </button>
      </div>

      <p
        style={{
          textAlign: "center",
          fontSize: "12px",
          color: "var(--text-muted)",
          marginTop: "8px",
        }}
      >
        Ambro pode cometer erros. Verifique informações importantes.
      </p>
    </form>
  );
}
