import {
	PRODUCT_HUNT_BADGE_ALT,
	PRODUCT_HUNT_BADGE_HREF,
	PRODUCT_HUNT_BADGE_SRC_DARK,
	PRODUCT_HUNT_BADGE_SRC_LIGHT,
} from "@/lib/product-hunt";

export function ProductHuntBadge({ className }: { className?: string }) {
	return (
		<a
			href={PRODUCT_HUNT_BADGE_HREF}
			target="_blank"
			rel="noopener noreferrer"
			className={className}
		>
			<img
				alt={PRODUCT_HUNT_BADGE_ALT}
				width={250}
				height={54}
				src={PRODUCT_HUNT_BADGE_SRC_LIGHT}
				className="dark:hidden"
				decoding="async"
			/>
			<img
				alt=""
				width={250}
				height={54}
				src={PRODUCT_HUNT_BADGE_SRC_DARK}
				className="hidden dark:block"
				aria-hidden
				loading="lazy"
				decoding="async"
			/>
		</a>
	);
}
