import { AppClerkProvider } from "@/components/app-clerk-provider";

export default function SsoCallbackLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <AppClerkProvider>{children}</AppClerkProvider>;
}
