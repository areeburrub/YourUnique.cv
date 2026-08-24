import { AppClerkProvider } from "@/components/app-clerk-provider";

export default function SignUpLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <AppClerkProvider>{children}</AppClerkProvider>;
}
