"use client";

import {
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from "react";
import Script from "next/script";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";

const TURNSTILE_SRC =
	"https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
	render: (
		element: HTMLElement,
		options: {
			sitekey: string;
			theme?: "light" | "dark" | "auto";
			size?: "normal" | "flexible" | "compact";
			appearance?: "always" | "execute" | "interaction-only";
			execution?: "render" | "execute";
			callback?: (token: string) => void;
			"expired-callback"?: () => void;
			"error-callback"?: () => void;
			"before-interactive-callback"?: () => void;
			"after-interactive-callback"?: () => void;
		},
	) => string;
	reset: (widgetId: string) => void;
	remove: (widgetId: string) => void;
	execute: (widgetId: string | HTMLElement) => void;
};

declare global {
	interface Window {
		turnstile?: TurnstileApi;
	}
}

export type TurnstileWidgetHandle = {
	reset: () => void;
	execute: () => void;
};

type TurnstileWidgetProps = {
	siteKey: string;
	onToken: (token: string) => void;
	onExpire: () => void;
};

export const TurnstileWidget = forwardRef<
	TurnstileWidgetHandle,
	TurnstileWidgetProps
>(function TurnstileWidget({ siteKey, onToken, onExpire }, ref) {
	const containerRef = useRef<HTMLDivElement>(null);
	const widgetIdRef = useRef<string | null>(null);
	const onTokenRef = useRef(onToken);
	const onExpireRef = useRef(onExpire);
	const { resolvedTheme } = useTheme();
	const [scriptReady, setScriptReady] = useState(false);
	const [interactive, setInteractive] = useState(false);
	const pendingExecute = useRef(false);

	onTokenRef.current = onToken;
	onExpireRef.current = onExpire;

	const teardown = useCallback(() => {
		if (widgetIdRef.current && window.turnstile) {
			window.turnstile.remove(widgetIdRef.current);
			widgetIdRef.current = null;
		}
	}, []);

	const renderWidget = useCallback(() => {
		if (!siteKey || !containerRef.current || !window.turnstile) {
			return;
		}
		teardown();
		setInteractive(false);
		widgetIdRef.current = window.turnstile.render(containerRef.current, {
			sitekey: siteKey,
			theme: resolvedTheme === "dark" ? "dark" : "light",
			size: "flexible",
			appearance: "interaction-only",
			execution: "execute",
			callback: (token) => {
				setInteractive(false);
				onTokenRef.current(token);
			},
			"expired-callback": () => onExpireRef.current(),
			"error-callback": () => onExpireRef.current(),
			"before-interactive-callback": () => setInteractive(true),
			"after-interactive-callback": () => setInteractive(false),
		});
		if (pendingExecute.current) {
			pendingExecute.current = false;
			window.turnstile.execute(containerRef.current);
		}
	}, [resolvedTheme, siteKey, teardown]);

	useImperativeHandle(ref, () => ({
		reset() {
			onExpireRef.current();
			setInteractive(false);
			if (widgetIdRef.current && window.turnstile) {
				window.turnstile.reset(widgetIdRef.current);
			}
		},
		execute() {
			if (!window.turnstile || !containerRef.current) {
				pendingExecute.current = true;
				return;
			}
			window.turnstile.execute(containerRef.current);
		},
	}));

	useEffect(() => {
		if (!scriptReady) {
			return;
		}
		renderWidget();
		return teardown;
	}, [renderWidget, scriptReady, teardown]);

	if (!siteKey) {
		return (
			<p className="text-sm text-destructive">
				Bot check is missing a site key.
			</p>
		);
	}

	return (
		<div className={cn(interactive ? "mb-4 min-h-[65px]" : "")}>
			<Script
				id="cf-turnstile"
				src={TURNSTILE_SRC}
				strategy="afterInteractive"
				onReady={() => setScriptReady(true)}
			/>
			<div
				ref={containerRef}
				className="cf-turnstile w-full max-w-[300px]"
				data-sitekey={siteKey}
			/>
		</div>
	);
});
