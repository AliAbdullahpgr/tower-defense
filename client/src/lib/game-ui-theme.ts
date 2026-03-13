import type { CSSProperties } from "react";

export const gameUiFonts = {
  display: "'Uncial Antiqua', serif",
  body: "'Philosopher', serif",
  numbers: "'Cinzel', serif",
} as const;

export const gameUiTheme = {
  page: "#eef6f4",
  surface: "rgba(246, 251, 250, 0.92)",
  surfaceStrong: "rgba(240, 248, 246, 0.96)",
  surfaceSoft: "rgba(255, 255, 255, 0.76)",
  surfaceTint: "rgba(228, 242, 239, 0.85)",
  surfaceMuted: "rgba(221, 237, 234, 0.88)",
  border: "rgba(37, 88, 92, 0.14)",
  borderStrong: "rgba(37, 88, 92, 0.24)",
  accent: "#3aa79f",
  accentStrong: "#267e78",
  accentSoft: "rgba(58, 167, 159, 0.14)",
  text: "#28464b",
  textStrong: "#16353b",
  muted: "#618087",
  mutedSoft: "#87a0a4",
  success: "#4f9b7f",
  successSoft: "rgba(79, 155, 127, 0.12)",
  warning: "#d39754",
  warningSoft: "rgba(211, 151, 84, 0.14)",
  danger: "#d66d78",
  dangerSoft: "rgba(214, 109, 120, 0.14)",
  info: "#5d90d8",
  infoSoft: "rgba(93, 144, 216, 0.14)",
  violet: "#8a79d6",
  violetSoft: "rgba(138, 121, 214, 0.12)",
  shadow: "0 20px 48px rgba(8, 34, 38, 0.14)",
  shadowSoft: "0 10px 24px rgba(8, 34, 38, 0.1)",
  inset: "inset 0 1px 0 rgba(255, 255, 255, 0.45)",
  radius: 18,
} as const;

export function panelStyle(options?: {
  padding?: string;
  tint?: string;
}): CSSProperties {
  return {
    background: options?.tint || gameUiTheme.surface,
    border: `1px solid ${gameUiTheme.border}`,
    borderRadius: `${gameUiTheme.radius}px`,
    boxShadow: `${gameUiTheme.shadowSoft}, ${gameUiTheme.inset}`,
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    padding: options?.padding || "14px",
  };
}

export function sectionTitleStyle(): CSSProperties {
  return {
    fontFamily: gameUiFonts.display,
    color: gameUiTheme.textStrong,
    fontSize: "15px",
    letterSpacing: "0.6px",
  };
}

export function chipStyle(options?: {
  active?: boolean;
  color?: string;
  background?: string;
}): CSSProperties {
  const color = options?.color || gameUiTheme.accent;
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "999px",
    padding: "5px 10px",
    border: `1px solid ${options?.active ? color : gameUiTheme.border}`,
    background:
      options?.background ||
      (options?.active ? `${color}18` : gameUiTheme.surfaceSoft),
    color: options?.active ? color : gameUiTheme.muted,
    fontSize: "10px",
    fontWeight: 700,
    fontFamily: gameUiFonts.body,
    letterSpacing: "0.3px",
  };
}

export function buttonStyle(
  kind: "accent" | "soft" | "danger" | "success" | "ghost" = "soft"
): CSSProperties {
  const map = {
    accent: {
      color: gameUiTheme.accentStrong,
      background: `linear-gradient(180deg, ${gameUiTheme.surfaceStrong}, #d9f1ee)`,
      border: `1px solid ${gameUiTheme.accent}`,
      shadow: `0 8px 16px ${gameUiTheme.accentSoft}`,
    },
    soft: {
      color: gameUiTheme.text,
      background: gameUiTheme.surfaceSoft,
      border: `1px solid ${gameUiTheme.border}`,
      shadow: gameUiTheme.shadowSoft,
    },
    danger: {
      color: gameUiTheme.danger,
      background: `linear-gradient(180deg, ${gameUiTheme.surfaceStrong}, #f8e5e8)`,
      border: `1px solid ${gameUiTheme.danger}`,
      shadow: `0 8px 16px ${gameUiTheme.dangerSoft}`,
    },
    success: {
      color: gameUiTheme.success,
      background: `linear-gradient(180deg, ${gameUiTheme.surfaceStrong}, #e3f3ec)`,
      border: `1px solid ${gameUiTheme.success}`,
      shadow: `0 8px 16px ${gameUiTheme.successSoft}`,
    },
    ghost: {
      color: gameUiTheme.muted,
      background: "transparent",
      border: `1px solid ${gameUiTheme.border}`,
      shadow: "none",
    },
  } as const;

  return {
    ...map[kind],
    borderRadius: "12px",
    padding: "9px 14px",
    fontFamily: gameUiFonts.body,
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.18s ease",
  };
}

export function metricValueStyle(color?: string): CSSProperties {
  return {
    color: color || gameUiTheme.textStrong,
    fontFamily: gameUiFonts.numbers,
    fontSize: "15px",
    fontWeight: 700,
    lineHeight: 1,
  };
}
