import { useState, useRef, useEffect, useCallback, type FormEvent, type KeyboardEvent } from "react";
import { SendHorizontal, Loader2, Mic, MicOff } from "lucide-react";

// ── Web Speech API types ────────────────────────────────
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}
interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event & { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const speechSupported = typeof window !== "undefined" &&
    (!!window.SpeechRecognition || !!window.webkitSpeechRecognition);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 480);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Cleanup recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  // ── Voice post-processing: domain-specific corrections ──
  const correctTranscript = useCallback((text: string): string => {
    // Map of common speech recognition errors → correct terms
    // Keys are lowercase patterns, values are replacements
    const corrections: [RegExp, string][] = [
      // Meses
      [/\bmarcio\b/gi, "março"],
      [/\bmarço\b/gi, "março"],
      [/\bjanero\b/gi, "janeiro"],
      [/\bfeverero\b/gi, "fevereiro"],
      [/\babriu\b/gi, "abril"],
      [/\bmaio\b/gi, "maio"],
      [/\bjuno\b/gi, "junho"],
      [/\bjulho\b/gi, "julho"],
      [/\bagusto\b/gi, "agosto"],
      [/\bsetenbro\b/gi, "setembro"],
      [/\boutumbro\b/gi, "outubro"],
      [/\bnovenbro\b/gi, "novembro"],
      [/\bdezenbro\b/gi, "dezembro"],

      // Marketplaces
      [/\bbagui\b/gi, "Bagy"],
      [/\bbague\b/gi, "Bagy"],
      [/\bbag\b/gi, "Bagy"],
      [/\bbaggy\b/gi, "Bagy"],
      [/\bchopee\b/gi, "Shopee"],
      [/\bshop\s*e\b/gi, "Shopee"],
      [/\bxopi\b/gi, "Shopee"],
      [/\bshopei\b/gi, "Shopee"],
      [/\bmercado\s*livro\b/gi, "Mercado Livre"],
      [/\bmercado\s*livre\b/gi, "Mercado Livre"],
      [/\bxein\b/gi, "Shein"],
      [/\bchein\b/gi, "Shein"],
      [/\bshein\b/gi, "Shein"],

      // Status
      [/\bpagos?\b/gi, (m) => m.toLowerCase()],
      [/\bcancelados?\b/gi, (m) => m.toLowerCase()],
      [/\bpendentes?\b/gi, (m) => m.toLowerCase()],
      [/\benviados?\b/gi, (m) => m.toLowerCase()],

      // Termos de negócio
      [/\bfaturanento\b/gi, "faturamento"],
      [/\btiquete?\s*médio\b/gi, "ticket médio"],
      [/\btiquete?\b/gi, "ticket"],
      [/\bmarketi?\s*place\b/gi, "marketplace"],
      [/\bmarket\s*places\b/gi, "marketplaces"],
      [/\brelatorio\b/gi, "relatório"],
      [/\brelatório\b/gi, "relatório"],
      [/\bdiagnóstico\b/gi, "diagnóstico"],
      [/\bdiagnostico\b/gi, "diagnóstico"],
      [/\bprevisao\b/gi, "previsão"],
      [/\bsazonalidade\b/gi, "sazonalidade"],
      [/\bcancelamento\b/gi, "cancelamento"],
      [/\bcomparação\b/gi, "comparação"],
      [/\bcomparacao\b/gi, "comparação"],

      // Números falados como texto
      [/\búltimos\s*trinta\s*dias\b/gi, "últimos 30 dias"],
      [/\búltimos\s*noventa\s*dias\b/gi, "últimos 90 dias"],
      [/\búltimos\s*sessenta\s*dias\b/gi, "últimos 60 dias"],
      [/\búltimos\s*sete\s*dias\b/gi, "últimos 7 dias"],

      // Frases comuns
      [/\bcomo\s*estão?\s*as\s*coisas\b/gi, "como estão as coisas"],
      [/\bcomo\s*estamos\b/gi, "como estamos"],
      [/\bresume?\s*executivo\b/gi, "resumo executivo"],
    ];

    let corrected = text;
    for (const [pattern, replacement] of corrections) {
      corrected = corrected.replace(pattern, replacement as string);
    }
    return corrected;
  }, []);

  const toggleVoice = useCallback(() => {
    if (isListening) {
      // Stop listening
      recognitionRef.current?.stop();
      setIsListening(false);
      setInterimText("");
      return;
    }

    // Start listening
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) return;

    const recognition = new SpeechRecognitionClass();
    recognition.lang = "pt-BR";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setInterimText("");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (finalTranscript) {
        const corrected = correctTranscript(finalTranscript);
        setMessage((prev) => {
          const separator = prev && !prev.endsWith(" ") ? " " : "";
          return prev + separator + corrected;
        });
        setInterimText("");
      } else {
        setInterimText(interim);
      }
    };

    recognition.onerror = (event) => {
      console.warn("[Voice] Error:", (event as Event & { error: string }).error);
      setIsListening(false);
      setInterimText("");
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText("");
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isListening, correctTranscript]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || disabled) return;
    // Stop voice if active
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setInterimText("");
    }
    onSend(trimmed);
    setMessage("");
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

  // ── Audio Visualizer ──────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  const startVisualizer = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioCtx = new AudioContext();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.7;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        animFrameRef.current = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const W = rect.width;
        const H = rect.height;
        ctx.clearRect(0, 0, W, H);

        // Draw waveform bars from center
        const barCount = Math.max(16, Math.min(40, Math.floor(W / 12)));
        const gap = W < 300 ? 2 : 3;
        const barWidth = (W - gap * (barCount - 1)) / barCount;
        const centerY = H / 2;

        for (let i = 0; i < barCount; i++) {
          // Sample from frequency data
          const dataIdx = Math.floor((i / barCount) * bufferLength * 0.7);
          const value = dataArray[dataIdx] / 255;
          
          // Min height + dynamic
          const barHeight = Math.max(4, value * (H * 0.8));
          const halfBar = barHeight / 2;
          
          const x = i * (barWidth + gap);
          
          // Gradient from accent to danger
          const t = i / barCount;
          const r = Math.round(99 + (248 - 99) * t);
          const g = Math.round(102 + (113 - 102) * t);
          const b = Math.round(241 + (113 - 241) * t);
          const alpha = 0.6 + value * 0.4;
          
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          ctx.beginPath();
          ctx.roundRect(x, centerY - halfBar, barWidth, barHeight, barWidth / 2);
          ctx.fill();
        }
      };

      draw();
    } catch (err) {
      console.warn("[Voice] Audio visualizer error:", err);
    }
  }, []);

  const stopVisualizer = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = 0;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  // Start/stop visualizer with listening state
  useEffect(() => {
    if (isListening) {
      startVisualizer();
    } else {
      stopVisualizer();
    }
    return () => stopVisualizer();
  }, [isListening, startVisualizer, stopVisualizer]);

  // Display text = typed text + interim voice text
  const displayValue = message + (interimText ? (message && !message.endsWith(" ") ? " " : "") + interimText : "");

  return (
    <form
      onSubmit={handleSubmit}
      className="chat-input-wrapper"
      style={{
        padding: "16px 16px 20px",
        background: "var(--bg-primary)",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div
        className="chat-input-container"
        style={{
          display: "flex",
          gap: "8px",
          alignItems: "flex-end",
          maxWidth: "800px",
          margin: "0 auto",
          background: "var(--bg-secondary)",
          border: isListening ? "1px solid var(--danger)" : "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          padding: "8px 8px 8px 16px",
          transition: "all 0.3s ease",
          boxShadow: isListening ? "0 0 24px rgba(248, 113, 113, 0.2), inset 0 0 12px rgba(248, 113, 113, 0.05)" : "none",
        }}
        onFocus={(e) => { if (!isListening) e.currentTarget.style.borderColor = "var(--accent)"; }}
        onBlur={(e) => { if (!isListening) e.currentTarget.style.borderColor = "var(--border)"; }}
      >
        {/* Waveform when listening, textarea when not */}
        {isListening ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", minHeight: "44px", position: "relative" }}>
            <canvas
              ref={canvasRef}
              style={{
                width: "100%",
                height: "44px",
                borderRadius: "6px",
              }}
            />
            {/* Overlay text showing interim/final */}
            {(interimText || message) && (
              <div
                style={{
                  position: "absolute",
                  bottom: "-2px",
                  left: 0,
                  right: 0,
                  textAlign: "center",
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-sans)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  padding: "0 8px",
                }}
              >
                {interimText ? `"${interimText}"` : message ? `✓ ${message.slice(-50)}` : ""}
              </div>
            )}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={displayValue}
            onChange={(e) => {
              setMessage(e.target.value);
              setInterimText("");
            }}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder={
              isMobile
                ? "Pergunte sobre seus dados..."
                : "Pergunte sobre seus dados... (ex: Quantos pedidos pagos em dezembro?)"
            }
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
        )}

        {/* Voice button */}
        {speechSupported && (
          <button
            type="button"
            onClick={toggleVoice}
            disabled={disabled}
            title={isListening ? "Parar gravação" : "Falar"}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: isListening ? "50%" : "var(--radius-sm)",
              background: isListening ? "var(--danger)" : "var(--bg-tertiary)",
              border: "none",
              color: isListening ? "white" : "var(--text-secondary)",
              cursor: disabled ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "all 0.3s ease",
              animation: isListening ? "pulse 1.5s ease-in-out infinite" : "none",
              position: "relative",
            }}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
        )}

        {/* Send button */}
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
        className="chat-input-footer"
        style={{
          textAlign: "center",
          fontSize: "11px",
          color: "var(--text-muted)",
          marginTop: "6px",
        }}
      >
        {isMobile
          ? (speechSupported ? "🎤 Toque no microfone para falar" : "Verifique informações importantes")
          : `Ambro pode cometer erros. Verifique informações importantes.${speechSupported ? " 🎤 Clique no microfone para falar." : ""}`
        }
      </p>
    </form>
  );
}
