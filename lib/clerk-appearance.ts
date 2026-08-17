export const clerkAppearance = {
	variables: {
		colorPrimary: "var(--brand)",
		colorForeground: "var(--foreground)",
		colorMutedForeground: "var(--muted-foreground)",
		colorBackground: "var(--card)",
		colorInput: "var(--card)",
		colorInputForeground: "var(--foreground)",
		colorBorder: "var(--border)",
		colorDanger: "var(--destructive)",
		colorNeutral: "var(--muted-foreground)",
		borderRadius: "1.25rem",
		fontFamily: "var(--font-body), Arial, sans-serif",
		fontFamilyButtons: "var(--font-body), Arial, sans-serif",
		fontSize: "0.9375rem",
	},
	elements: {
		rootBox: "w-full",
		cardBox: "w-full shadow-none",
		card: "w-full gap-6 border-0 bg-card p-6 shadow-none sm:p-8",
		logoBox: "h-12",
		logoImage: "h-12 w-auto",
		headerTitle:
			"font-[family-name:var(--font-display)] text-[24px] leading-8 font-semibold tracking-[-0.48px] text-foreground",
		headerSubtitle: "text-[15px] leading-6 text-muted-foreground",
		socialButtonsBlockButton:
			"h-12 rounded-full border border-border bg-card text-foreground shadow-none hover:bg-muted",
		socialButtonsBlockButtonText: "font-medium text-foreground",
		dividerLine: "bg-border",
		dividerText: "text-muted-soft text-[13px] uppercase tracking-[0.08em]",
		formFieldLabel: "text-[14px] font-medium text-foreground",
		formFieldInput:
			"h-12 rounded-2xl border border-border bg-card text-foreground shadow-none focus:border-brand focus:ring-2 focus:ring-brand/10",
		formButtonPrimary:
			"h-12 rounded-full bg-brand text-brand-foreground shadow-none hover:bg-brand/90",
		footerAction: "text-[14px] text-muted-foreground",
		footerActionLink: "font-medium text-brand hover:opacity-90",
		identityPreviewEditButton: "text-brand",
		formFieldInputShowPasswordButton: "text-muted-foreground",
		footer: "bg-transparent",
		footerPages: "hidden",
	},
	options: {
		socialButtonsPlacement: "top" as const,
		socialButtonsVariant: "blockButton" as const,
	},
};
