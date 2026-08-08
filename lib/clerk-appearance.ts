export const clerkAppearance = {
	variables: {
		colorPrimary: "var(--foreground)",
		colorForeground: "var(--foreground)",
		colorMutedForeground: "var(--muted-foreground)",
		colorBackground: "var(--background)",
		colorInput: "var(--background)",
		colorInputForeground: "var(--foreground)",
		colorBorder: "var(--border)",
		colorDanger: "var(--destructive)",
		colorNeutral: "var(--muted-foreground)",
		borderRadius: "0.5rem",
		fontFamily: "var(--font-body), Arial, sans-serif",
		fontFamilyButtons: "var(--font-body), Arial, sans-serif",
		fontSize: "0.9375rem",
	},
	elements: {
		rootBox: "w-full",
		cardBox: "w-full shadow-none",
		card: "w-full gap-6 border border-border bg-background p-6 shadow-none sm:p-8",
		headerTitle:
			"font-[family-name:var(--font-display)] text-[24px] leading-8 font-semibold tracking-[-0.48px] text-foreground",
		headerSubtitle: "text-[15px] leading-6 text-muted-foreground",
		socialButtonsBlockButton:
			"border border-border bg-background text-foreground shadow-none hover:bg-muted",
		socialButtonsBlockButtonText: "font-medium text-foreground",
		dividerLine: "bg-border",
		dividerText: "text-muted-soft text-[13px] uppercase tracking-[-0.14px]",
		formFieldLabel: "text-[14px] font-medium text-foreground",
		formFieldInput:
			"h-10 rounded-[8px] border border-border bg-background text-foreground shadow-none focus:border-brand focus:ring-2 focus:ring-brand/10",
		formButtonPrimary:
			"h-10 rounded-[8px] bg-primary text-primary-foreground shadow-none hover:bg-primary/90",
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
