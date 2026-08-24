"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";

import {
	SignedInHeaderActions,
	SignedOutHeaderActions,
} from "@/components/landing/site-header-actions";

const SiteHeaderUserMenu = dynamic(
	() =>
		import("@/components/landing/site-header-signed-in").then(
			(mod) => mod.SiteHeaderUserMenu,
		),
	{
		ssr: false,
		loading: () => <span className="size-11 shrink-0" aria-hidden />,
	},
);

function hasClerkSession() {
	return document.cookie.split(";").some((part) => {
		const [name, value] = part.trim().split("=");
		return Boolean(name?.startsWith("__client_uat") && value && value !== "0");
	});
}

function subscribe() {
	return () => {};
}

export function SiteHeaderAuth() {
	const hasSession = useSyncExternalStore(
		subscribe,
		hasClerkSession,
		() => false,
	);

	if (!hasSession) {
		return <SignedOutHeaderActions />;
	}

	return <SignedInHeaderActions menu={<SiteHeaderUserMenu />} />;
}
