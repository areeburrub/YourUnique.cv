"use client";

import { MixpanelEvent, trackEvent } from "@/lib/mixpanel";

export function MixpanelCheckoutLink({
	href,
	source,
	className,
	children,
	onClick,
	...props
}: React.ComponentProps<"a"> & {
	source: string;
}) {
	return (
		<a
			href={href}
			className={className}
			onClick={(event) => {
				trackEvent(MixpanelEvent.CheckoutStarted, { source }, {
					sendImmediately: true,
				});
				onClick?.(event);
			}}
			{...props}
		>
			{children}
		</a>
	);
}
