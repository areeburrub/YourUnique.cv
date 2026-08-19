import { cn } from "@/lib/utils";

// Phosphor "Sparkle" (fill) glyph, centered on its own bounding-box centroid
// (~117,144 in its native 256x256 box) so scale/rotate below stays anchored
// on the shape itself rather than the icon's canvas.
const SPARKLE_PATH =
	"M208,144a15.78,15.78,0,0,1,-10.42,14.94L146,178l-19,51.62a15.92,15.92,0,0,1,-29.88,0L78,178l-51.62,-19a15.92,15.92,0,0,1,0,-29.88L78,110l19,-51.62a15.92,15.92,0,0,1,29.88,0L146,110l51.62,19A15.78,15.78,0,0,1,208,144Z";
const SPARKLE_CENTER = { x: 117.19, y: 144 };
const SPARKLE_NATIVE_WIDTH = 181.6;

function Sparkle({
	targetWidth,
	className,
}: {
	targetWidth: number;
	className: string;
}) {
	const scale = targetWidth / SPARKLE_NATIVE_WIDTH;
	return (
		<g className={className}>
			<g transform={`scale(${scale}) translate(${-SPARKLE_CENTER.x} ${-SPARKLE_CENTER.y})`}>
				<path d={SPARKLE_PATH} fill="currentColor" />
			</g>
		</g>
	);
}

export function SparkleShuffle({
	className,
	size = 28,
}: {
	className?: string;
	size?: number;
}) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="3 3 26 26"
			className={cn("overflow-visible text-current", className)}
			aria-hidden
		>
			<style>{`
				.ss-orbit { animation: ss-orbit 3s linear infinite; }
				.ss-orbit-b { animation-delay: -1s; }
				.ss-orbit-c { animation-delay: -2s; }
				.ss-twinkle {
					transform-box: fill-box;
					transform-origin: center;
					animation: ss-twinkle 1.5s linear infinite;
				}
				.ss-twinkle-b { animation-delay: -0.5s; }
				.ss-twinkle-c { animation-delay: -1s; }
				@keyframes ss-orbit {
					0%, 100% { transform: translate(9px, 10px); }
					33.333% { transform: translate(23px, 11px); }
					66.666% { transform: translate(16px, 23px); }
				}
				@keyframes ss-twinkle {
					0%, 100% { transform: scale(0.85) rotate(-6deg); opacity: 0.65; }
					50% { transform: scale(1.05) rotate(6deg); opacity: 1; }
				}
				@media (prefers-reduced-motion: reduce) {
					.ss-orbit, .ss-twinkle { animation: none !important; }
					.ss-orbit { transform: translate(9px, 10px); }
					.ss-orbit-b { transform: translate(23px, 11px); }
					.ss-orbit-c { transform: translate(16px, 23px); }
				}
			`}</style>
			<g className="ss-orbit">
				<Sparkle targetWidth={11} className="ss-twinkle" />
			</g>
			<g className="ss-orbit ss-orbit-b">
				<Sparkle targetWidth={7.5} className="ss-twinkle ss-twinkle-b" />
			</g>
			<g className="ss-orbit ss-orbit-c">
				<Sparkle targetWidth={5.5} className="ss-twinkle ss-twinkle-c" />
			</g>
		</svg>
	);
}
