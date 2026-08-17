"use client";

import { useEffect } from "react";

const APP_HEIGHT_VAR = "--app-height";

export function useVisualViewportHeight() {
	useEffect(() => {
		const root = document.documentElement;
		const viewport = window.visualViewport;
		let frame = 0;

		const sync = () => {
			const height = viewport?.height ?? window.innerHeight;
			root.style.setProperty(APP_HEIGHT_VAR, `${height}px`);
			if (window.scrollY !== 0 || window.scrollX !== 0) {
				window.scrollTo(0, 0);
			}
		};

		const onChange = () => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(sync);
		};

		sync();
		viewport?.addEventListener("resize", onChange);
		viewport?.addEventListener("scroll", onChange);
		window.addEventListener("orientationchange", onChange);

		return () => {
			cancelAnimationFrame(frame);
			viewport?.removeEventListener("resize", onChange);
			viewport?.removeEventListener("scroll", onChange);
			window.removeEventListener("orientationchange", onChange);
			root.style.removeProperty(APP_HEIGHT_VAR);
		};
	}, []);
}
