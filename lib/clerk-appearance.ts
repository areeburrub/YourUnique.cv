import type { Appearance } from "@clerk/ui";

export const clerkAppearance = {
	theme: "simple",
	variables: {
		colorPrimary: "var(--brand)",
		colorPrimaryForeground: "var(--brand-foreground)",
		colorForeground: "var(--foreground)",
		colorMuted: "var(--muted)",
		colorMutedForeground: "var(--muted-foreground)",
		colorBackground: "var(--card)",
		colorInput: "var(--card)",
		colorInputForeground: "var(--foreground)",
		colorBorder: "var(--border)",
		colorDanger: "var(--destructive)",
		colorNeutral: "var(--muted-foreground)",
		colorRing: "var(--brand)",
		borderRadius: "0.75rem",
		fontFamily: "var(--font-body), Arial, sans-serif",
		fontFamilyButtons: "var(--font-body), Arial, sans-serif",
		fontSize: "0.9375rem",
	},
	options: {
		unsafe_disableDevelopmentModeWarnings: true,
	},
} satisfies Appearance;
