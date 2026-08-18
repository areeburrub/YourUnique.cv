"use client";

import { MixpanelEvent, trackEvent } from "@/lib/mixpanel";

type MixpanelCheckoutLinkProps = {
	href: string;
	source: string;
	className?: string;
	children: React.ReactNode;
};

export function MixpanelCheckoutLink({
	href,
	source,
	className,
	children,
}: MixpanelCheckoutLinkProps) {
	return (
		<a
			href={href}
			className={className}
			onClick={() => {
				trackEvent(MixpanelEvent.CheckoutStarted, { source }, {
					sendImmediately: true,
				});
			}}
		>
			{children}
		</a>
	);
}
