import type { CSSProperties } from "react";

export const gameUiFonts = {
  display: "'Uncial Antiqua', serif",
  body: "'Philosopher', serif",
  numbers: "'Cinzel', serif",
} as const;
export const gameUiTheme = {
  page: "#081014", // Deeper, slightly blueish dark stone theme
  surface: "rgba(12, 22, 28, 0.95)",
  surfaceStrong: "rgba(18, 30, 38, 0.98)",
  surfaceSoft: "rgba(20, 32, 40, 0.7)",
  surfaceTint: "rgba(124, 186, 204, 0.04)",
  surfaceMuted: "rgba(28, 45, 54, 0.4)",
  border: "rgba(92, 137, 148, 0.2)",
  borderStrong: "rgba(124, 186, 204, 0.35)",
  accent: "#2cb1c4",
  accentStrong: "#5cdceb",
  accentSoft: "rgba(44, 177, 196, 0.15)",
  cyan: "#138c9e",
  cyanSoft: "rgba(19, 140, 158, 0.1)",
  text: "#c5e6e3",
  textStrong: "#e8fdfa",
  textBright: "#ffffff",
  muted: "#739999",
  mutedSoft: "#4a6b6b",
  success: "#38b056",
  successSoft: "rgba(56, 176, 86, 0.12)",
  warning: "#df9119",
  warningSoft: "rgba(223, 145, 25, 0.12)",
  danger: "#d93b3b",
  dangerSoft: "rgba(217, 59, 59, 0.12)",
  info: "#3676db",
  infoSoft: "rgba(54, 118, 219, 0.12)",
  violet: "#9074d6",
  violetSoft: "rgba(144, 116, 214, 0.12)",
  gold: "#e6ad1c",
  goldSoft: "rgba(230, 173, 28, 0.12)",
  shadow: "0 6px 16px rgba(0, 0, 0, 0.6)",
  shadowSoft: "0 3px 8px rgba(0, 0, 0, 0.4)",
  glow: "0 0 16px rgba(44, 177, 196, 0.2)",
  glowStrong: "0 0 24px rgba(44, 177, 196, 0.3)",
  radius: 4,     // Sharp classic corners
  radiusLg: 6,   // Slightly larger classic corners
} as const;

export function panelStyle(options?: {
  padding?: string;
  tint?: string;
  glow?: boolean;
}): CSSProperties {
  return {
    background: options?.tint || gameUiTheme.surface,
    border: `2px solid ${gameUiTheme.border}`,
    borderRadius: `${gameUiTheme.radius}px`,
    boxShadow: `inset 0 0 40px rgba(0,0,0,0.5), ${options?.glow
        ? `${gameUiTheme.shadowSoft}, ${gameUiTheme.glow}`
        : gameUiTheme.shadowSoft
      }`,
    padding: options?.padding || "10px",
  };
}

export function cardStyle(options?: {
  selected?: boolean;
  color?: string;
}): CSSProperties {
  const color = options?.color || gameUiTheme.accent;
  return {
    background: options?.selected
      ? `linear-gradient(180deg, ${color}15, rgba(12, 22, 28, 0.95))`
      : "linear-gradient(180deg, rgba(24, 36, 44, 0.8), rgba(12, 22, 28, 0.95))",
    border: `2px solid ${options?.selected ? color : gameUiTheme.border}`,
    borderRadius: "4px",
    boxShadow: options?.selected
      ? `0 2px 12px ${color}10`
      : "none",
    transition: "all 0.2s ease",
  };
}

export function sectionTitleStyle(): CSSProperties {
  return {
    fontFamily: gameUiFonts.display,
    color: gameUiTheme.accent,
    fontSize: "12px",
    letterSpacing: "1.5px",
    textShadow: `0 0 6px ${gameUiTheme.accent}20`,
  };
}

export function chipStyle(options?: {
  active?: boolean;
  color?: string;
  background?: string;
  size?: "sm" | "md";
}): CSSProperties {
  const color = options?.color || gameUiTheme.accent;
  const size = options?.size || "md";
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "2px",
    padding: size === "sm" ? "2px 6px" : "4px 10px",
    border: `1px solid ${options?.active ? color : gameUiTheme.border}`,
    background: options?.background || (options?.active ? `${color}10` : "rgba(20, 50, 50, 0.3)"),
    color: options?.active ? color : gameUiTheme.muted,
    fontSize: size === "sm" ? "9px" : "10px",
    fontWeight: 500,
    fontFamily: gameUiFonts.body,
    letterSpacing: "0.3px",
  };
}

export function buttonStyle(
  kind: "accent" | "soft" | "danger" | "success" | "ghost" = "soft"
): CSSProperties {
  const map = {
    accent: {
      color: gameUiTheme.textBright,
      background: `linear-gradient(180deg, rgba(44, 177, 196, 0.6), rgba(19, 140, 158, 0.8))`,
      border: `2px solid ${gameUiTheme.accentStrong}`,
      shadow: `inset 0 1px 0 rgba(255,255,255,0.2), ${gameUiTheme.glow}`,
    },
    soft: {
      color: gameUiTheme.text,
      background: "linear-gradient(180deg, rgba(38, 56, 64, 0.8), rgba(20, 32, 40, 0.9))",
      border: `2px solid ${gameUiTheme.borderStrong}`,
      shadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
    },
    danger: {
      color: gameUiTheme.textBright,
      background: `linear-gradient(180deg, rgba(217, 59, 59, 0.6), rgba(168, 32, 32, 0.8))`,
      border: `2px solid #ef4444`,
      shadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
    },
    success: {
      color: gameUiTheme.textBright,
      background: `linear-gradient(180deg, rgba(56, 176, 86, 0.6), rgba(34, 122, 54, 0.8))`,
      border: `2px solid #4ade80`,
      shadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
    },
    ghost: {
      color: gameUiTheme.muted,
      background: "transparent",
      border: "2px solid transparent",
      shadow: "none",
    },
  } as const;

  return {
    ...map[kind],
    borderRadius: "4px",
    padding: "6px 14px",
    fontFamily: gameUiFonts.body,
    fontSize: "11px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.18s ease",
  };
}

export function metricValueStyle(color?: string): CSSProperties {
  return {
    color: color || gameUiTheme.accentStrong,
    fontFamily: gameUiFonts.numbers,
    fontSize: "14px",
    fontWeight: 600,
    lineHeight: 1,
    textShadow: `0 0 8px ${(color || gameUiTheme.accent)}25`,
  };
}