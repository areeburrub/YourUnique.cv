"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";

import { initMixpanel } from "@/lib/mixpanel";

const Analytics = dynamic(
	() => import("@vercel/analytics/next").then((mod) => mod.Analytics),
	{ ssr: false },
);

const SpeedInsights = dynamic(
	() =>
		import("@vercel/speed-insights/next").then((mod) => mod.SpeedInsights),
	{ ssr: false },
);

function MixpanelInit() {
	useEffect(() => {
		void initMixpanel();
	}, []);

	return null;
}

export function DeferredMetrics() {
	return (
		<>
			<MixpanelInit />
			<Analytics />
			<SpeedInsights />
		</>
	);
}
