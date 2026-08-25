import { cn } from "@/lib/utils";

export function PeerlistLogo({ className }: { className?: string }) {
	return (
		<img
			src="/assets/peerlist/logo.webp"
			alt=""
			width={40}
			height={40}
			className={cn("size-10 rounded-xl object-cover", className)}
			decoding="async"
		/>
	);
}
