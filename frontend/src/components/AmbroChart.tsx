import { useRef, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarController,
  LineController,
  PieController,
  DoughnutController,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartConfiguration,
} from "chart.js";

// Register all Chart.js components (controllers AND elements)
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarController,
  LineController,
  PieController,
  DoughnutController,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// ── Color palette for dark theme ────────────────────────
const COLORS = [
  "#6366F1", // indigo (accent)
  "#34D399", // emerald
  "#FBBF24", // amber
  "#F87171", // red
  "#818CF8", // indigo-light
  "#2DD4BF", // teal
  "#FB923C", // orange
  "#A78BFA", // violet
  "#38BDF8", // sky
  "#F472B6", // pink
];

const COLORS_ALPHA = COLORS.map((c) => c + "40"); // 25% opacity for fills

export interface ChartData {
  type: "bar" | "line" | "pie" | "doughnut" | "horizontalBar";
  title?: string;
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    color?: string;
  }>;
  options?: {
    currency?: boolean; // format Y axis as R$
    percentage?: boolean; // format Y axis as %
    stacked?: boolean;
    showLegend?: boolean;
  };
}

// ── Parse chart JSON from message content ───────────────
export function extractCharts(content: string): { text: string; charts: ChartData[] } {
  const charts: ChartData[] = [];
  const chartRegex = /```chart\n([\s\S]*?)```/g;

  const text = content.replace(chartRegex, (_match, jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr.trim());
      charts.push(parsed);
      return `%%CHART_${charts.length - 1}%%`;
    } catch (e) {
      console.warn("Failed to parse chart JSON:", e);
      return _match; // Keep original if parse fails
    }
  });

  return { text, charts };
}

// ── Chart Component ─────────────────────────────────────
export function AmbroChart({ data }: { data: ChartData }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartJS | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Destroy any existing chart on this canvas (handles React Strict Mode double-mount)
    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    // Also check if there's an existing chart instance on the canvas (safety check)
    const existingChart = ChartJS.getChart(canvasRef.current);
    if (existingChart) {
      existingChart.destroy();
    }

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const isCurrency = data.options?.currency;
    const isPercentage = data.options?.percentage;
    const isHorizontal = data.type === "horizontalBar";
    const isPie = data.type === "pie" || data.type === "doughnut";

    const formatValue = (value: number) => {
      if (isCurrency) {
        return "R$ " + value.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
      }
      if (isPercentage) return value.toFixed(1) + "%";
      return value.toLocaleString("pt-BR");
    };

    const datasets = data.datasets.map((ds, i) => {
      const color = ds.color || COLORS[i % COLORS.length];
      const alphaColor = COLORS_ALPHA[i % COLORS_ALPHA.length];

      if (isPie) {
        return {
          label: ds.label,
          data: ds.data,
          backgroundColor: ds.data.map((_, j) => COLORS[j % COLORS.length]),
          borderColor: ds.data.map((_, j) => COLORS[j % COLORS.length]),
          borderWidth: 2,
          hoverOffset: 8,
        };
      }

      return {
        label: ds.label,
        data: ds.data,
        backgroundColor: data.type === "line" ? alphaColor : color,
        borderColor: color,
        borderWidth: data.type === "line" ? 3 : 0,
        borderRadius: data.type === "bar" || isHorizontal ? 6 : 0,
        fill: data.type === "line",
        tension: 0.4,
        pointRadius: data.type === "line" ? 4 : 0,
        pointHoverRadius: data.type === "line" ? 7 : 0,
        pointBackgroundColor: color,
        pointBorderColor: "#12151C",
        pointBorderWidth: 2,
      };
    });

    const config: ChartConfiguration = {
      type: isHorizontal ? "bar" : (isPie ? data.type : data.type) as ChartConfiguration["type"],
      data: {
        labels: data.labels,
        datasets: datasets as ChartConfiguration["data"]["datasets"],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: isHorizontal ? "y" : "x",
        plugins: {
          legend: {
            display: data.options?.showLegend !== false && (data.datasets.length > 1 || isPie),
            position: isPie ? "bottom" : "top",
            labels: {
              color: "#9CA3AF",
              font: { family: "'DM Sans', sans-serif", size: 12 },
              padding: 16,
              usePointStyle: true,
              pointStyle: "circle",
            },
          },
          title: {
            display: !!data.title,
            text: data.title || "",
            color: "#F0F1F3",
            font: { family: "'DM Sans', sans-serif", size: 15, weight: "bold" as const },
            padding: { bottom: 16 },
          },
          tooltip: {
            backgroundColor: "#1A1E28",
            titleColor: "#F0F1F3",
            bodyColor: "#9CA3AF",
            borderColor: "#2A2F3C",
            borderWidth: 1,
            cornerRadius: 8,
            padding: 12,
            titleFont: { family: "'DM Sans', sans-serif", weight: "bold" as const },
            bodyFont: { family: "'DM Sans', sans-serif" },
            callbacks: {
              label: (ctx) => {
                const label = ctx.dataset.label || "";
                const value = ctx.parsed?.y ?? ctx.parsed ?? 0;
                return label + ": " + formatValue(typeof value === "number" ? value : 0);
              },
            },
          },
        },
        scales: isPie ? {} : {
          x: {
            grid: { color: "#2A2F3C", lineWidth: 0.5 },
            ticks: {
              color: "#6B7280",
              font: { family: "'DM Sans', sans-serif", size: 11 },
              maxRotation: 45,
            },
            stacked: data.options?.stacked,
          },
          y: {
            grid: { color: "#2A2F3C", lineWidth: 0.5 },
            ticks: {
              color: "#6B7280",
              font: { family: "'DM Sans', sans-serif", size: 11 },
              callback: (value) => formatValue(Number(value)),
            },
            stacked: data.options?.stacked,
          },
        },
        animation: {
          duration: 800,
          easing: "easeOutQuart",
        },
      },
    };

    chartRef.current = new ChartJS(ctx, config);

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [data]);

  const height = (data.type === "pie" || data.type === "doughnut") ? 280 : 300;

  return (
    <div
      style={{
        background: "var(--bg-tertiary)",
        borderRadius: "12px",
        border: "1px solid var(--border)",
        padding: "20px",
        margin: "12px 0",
        position: "relative",
        height: height + "px",
      }}
    >
      <canvas ref={canvasRef} />
    </div>
  );
}
