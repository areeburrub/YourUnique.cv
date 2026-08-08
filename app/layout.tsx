import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ui } from "@clerk/ui";
import { Inter, Inter_Tight } from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";
import { clerkAppearance } from "@/lib/clerk-appearance";

import "./globals.css";

const inter = Inter({
	variable: "--font-body",
	subsets: ["latin"],
});

const interTight = Inter_Tight({
	variable: "--font-display",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "YourUnique.cv | Resumes that match the job",
	description:
		"Chat with an agent that knows your career story. Paste a job description, get a tailored professional resume PDF.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
	return (
		<html
			lang="en"
			suppressHydrationWarning
			className={`${inter.variable} ${interTight.variable} h-full antialiased`}
		>
			<body className="flex min-h-full flex-col font-sans">
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					<ClerkProvider
						ui={ui}
						appearance={clerkAppearance}
						signInUrl="/sign-in"
						signUpUrl="/sign-up"
						signInFallbackRedirectUrl="/new-chat"
						signUpFallbackRedirectUrl="/new-chat"
					>
						{children}
					</ClerkProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
