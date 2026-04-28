// Design Tokens - Purple Gradient Theme
export const colors = {
  // Purple brand colors
  brand: "#8b5cf6", // Vibrant purple
  brandLight: "#a78bfa",
  brandDark: "#7c3aed",

  // Purple accent (lighter)
  accent: "#c4b5fd", // Light purple
  accentLight: "#ddd6fe",
  accentDark: "#a78bfa",

  // Gradient backgrounds
  gradientStart: "#f3e8ff", // Very light purple
  gradientEnd: "#ede9fe", // Slightly darker light purple
  gradientMid: "#e9d5ff", // Medium light purple

  // Danger/Warning (keeping for balance)
  danger: "#ec4899", // Pink-purple for danger
  dangerLight: "#f472b6",
  dangerDark: "#db2777",

  // Success (keeping but purple-tinted)
  success: "#a78bfa", // Purple
  successLight: "#c4b5fd",
  successDark: "#8b5cf6",

  // Neutrals (light versions)
  dark: "#7c3aed", // Dark purple instead of black
  darkMuted: "#8b5cf6", // Medium purple
  muted: "#a78bfa", // Light purple
  mutedLight: "#c4b5fd", // Very light purple
  light: "#f3e8ff", // Almost white, light purple
  lightMuted: "#ede9fe", // Very light grayish purple
  white: "#ffffff", // Keep pure white for contrast

  // Backgrounds - All gradients
  bg: "linear-gradient(135deg, #f3e8ff 0%, #ede9fe 50%, #e9d5ff 100%)",
  bgCard: "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)",
  bgCardHover: "linear-gradient(135deg, #ede9fe 0%, #e9d5ff 100%)",

  // Borders
  border: "#d8b4fe", // Light purple border
  borderLight: "#e9d5ff",
};

export const fonts = {
  caveat: "'Caveat', cursive",
  dmSans: "'DM Sans', sans-serif",
  dmMono: "'DM Mono', monospace",
};

export const shadow = {
  sm: "0 1px 2px 0 rgba(139, 92, 246, 0.15)",
  md: "0 4px 6px -1px rgba(139, 92, 246, 0.2)",
  lg: "0 10px 15px -3px rgba(139, 92, 246, 0.25)",
  xl: "0 20px 25px -5px rgba(139, 92, 246, 0.3)",
};

export const borderRadius = {
  sm: "4px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  full: "9999px",
};

export const spacing = {
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "24px",
  "2xl": "32px",
  "3xl": "48px",
};

export const transitions = {
  fast: "150ms ease-in-out",
  base: "200ms ease-in-out",
  slow: "300ms ease-in-out",
};

// Component styles
export const buttonStyle = (
  variant: "primary" | "secondary" | "danger" | "ghost" = "primary",
) => {
  const baseStyle: React.CSSProperties = {
    fontFamily: fonts.dmSans,
    fontSize: "14px",
    fontWeight: 500,
    padding: `${spacing.md} ${spacing.lg}`,
    borderRadius: borderRadius.md,
    border: "none",
    cursor: "pointer",
    transition: `all ${transitions.fast}`,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  };

  const variants = {
    primary: {
      ...baseStyle,
      backgroundColor: colors.brand,
      color: colors.white,
      "&:hover": { backgroundColor: colors.brandLight },
      "&:active": { backgroundColor: colors.brandDark },
    },
    secondary: {
      ...baseStyle,
      backgroundColor: colors.darkMuted,
      color: colors.light,
      border: `1px solid ${colors.border}`,
      "&:hover": { backgroundColor: colors.muted },
    },
    danger: {
      ...baseStyle,
      backgroundColor: colors.danger,
      color: colors.white,
      "&:hover": { backgroundColor: colors.dangerLight },
    },
    ghost: {
      ...baseStyle,
      backgroundColor: "transparent",
      color: colors.light,
      border: `1px solid ${colors.border}`,
      "&:hover": { backgroundColor: colors.darkMuted },
    },
  };

  return variants[variant];
};

export const cardStyle: React.CSSProperties = {
  background: colors.bgCard,
  border: `1px solid ${colors.border}`,
  borderRadius: borderRadius.lg,
  padding: spacing.lg,
  boxShadow: shadow.md,
  position: "relative",
};

// Notepad card style (with torn edges effect)
export const notepadCardStyle: React.CSSProperties = {
  ...cardStyle,
  borderLeft: `4px solid ${colors.brand}`,
  borderBottom: `2px dashed ${colors.border}`,
  borderRadius: borderRadius.md,
  transform: "rotate(-1deg)",
  position: "relative",
};

export const inputStyle: React.CSSProperties = {
  fontFamily: fonts.dmSans,
  fontSize: "14px",
  padding: `${spacing.md} ${spacing.lg}`,
  backgroundColor: "#ffffff",
  color: "#5b21b6",
  border: `2px solid ${colors.border}`,
  borderRadius: borderRadius.md,
  transition: `all ${transitions.fast}`,
  outline: "none",
};

export const labelStyle: React.CSSProperties = {
  fontFamily: fonts.dmSans,
  fontSize: "12px",
  fontWeight: 500,
  color: colors.mutedLight,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  marginBottom: spacing.sm,
  display: "block",
};

export const badgeStyle = (
  variant: "success" | "danger" | "warning" | "info" = "info",
) => {
  const variants = {
    success: {
      backgroundColor: `rgba(167, 139, 250, 0.15)`,
      color: "#6d28d9",
      borderColor: colors.success,
    },
    danger: {
      backgroundColor: `rgba(236, 72, 153, 0.15)`,
      color: "#be185d",
      borderColor: colors.danger,
    },
    warning: {
      backgroundColor: `rgba(236, 72, 153, 0.15)`,
      color: "#be185d",
      borderColor: colors.danger,
    },
    info: {
      backgroundColor: `rgba(167, 139, 250, 0.15)`,
      color: "#6d28d9",
      borderColor: colors.success,
    },
  };

  return {
    ...variants[variant],
    fontFamily: fonts.dmSans,
    fontSize: "12px",
    fontWeight: 600,
    padding: `${spacing.xs} ${spacing.md}`,
    borderRadius: borderRadius.full,
    border: `1px solid`,
    display: "inline-block",
    whiteSpace: "nowrap" as const,
  };
};
