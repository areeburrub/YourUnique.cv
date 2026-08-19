"use client";

import { CommitStrategy, useScribe } from "@elevenlabs/react";
import { CircleNotchIcon, MicrophoneIcon, SquareIcon } from "@phosphor-icons/react";
import {
	useEffect,
	useEffectEvent,
	useImperativeHandle,
	useRef,
	useState,
	type Ref,
} from "react";
import { flushSync } from "react-dom";

import { cn } from "@/lib/utils";

function joinSpoken(base: string, spoken: string) {
	if (!spoken) {
		return base;
	}
	if (!base) {
		return spoken;
	}
	if (/\s$/.test(base) || /^[.,!?;:]/.test(spoken)) {
		return base + spoken;
	}
	return `${base} ${spoken}`;
}

function spokenFromScribe(
	committed: Array<{ text: string }>,
	partial: string,
) {
	const committedText = committed
		.map((segment) => segment.text.trim())
		.filter(Boolean)
		.join(" ");
	const partialText = partial.trim();
	return [committedText, partialText].filter(Boolean).join(" ");
}

export type SpeechToTextHandle = {
	stop: () => string | null;
};

type SpeechToTextButtonProps = {
	text: string;
	onTextChange: (value: string) => void;
	onError: (message: string) => void;
	disabled?: boolean;
	submitOnEnter?: boolean;
	ref?: Ref<SpeechToTextHandle>;
};

export function SpeechToTextButton({
	text,
	onTextChange,
	onError,
	disabled,
	submitOnEnter = false,
	ref,
}: SpeechToTextButtonProps) {
	const baseTextRef = useRef("");
	const textRef = useRef(text);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const [listening, setListening] = useState(false);
	const [starting, setStarting] = useState(false);

	textRef.current = text;

	const handleScribeError = useEffectEvent((message: string) => {
		onError(message);
		setListening(false);
		setStarting(false);
	});

	const scribe = useScribe({
		modelId: "scribe_v2_realtime",
		commitStrategy: CommitStrategy.VAD,
		onError: (error) => {
			handleScribeError(
				error instanceof Error
					? error.message
					: "Speech recognition failed",
			);
		},
		onAuthError: () => {
			handleScribeError("Speech recognition auth failed");
		},
		onQuotaExceededError: () => {
			handleScribeError("Speech recognition quota exceeded");
		},
		onDisconnect: () => {
			setListening(false);
			setStarting(false);
		},
	});

	const disconnectRef = useRef(scribe.disconnect);
	disconnectRef.current = scribe.disconnect;

	const applyTranscript = useEffectEvent(
		(committed: Array<{ text: string }>, partial: string) => {
			if (!listening) {
				return;
			}
			onTextChange(
				joinSpoken(
					baseTextRef.current,
					spokenFromScribe(committed, partial),
				),
			);
		},
	);

	useEffect(() => {
		applyTranscript(scribe.committedTranscripts, scribe.partialTranscript);
	}, [applyTranscript, scribe.committedTranscripts, scribe.partialTranscript]);

	useEffect(() => {
		return () => {
			disconnectRef.current();
		};
	}, []);

	const lastFinalizedRef = useRef<string | null>(null);

	const finalize = () => {
		const wasActive =
			listening ||
			scribe.isConnected ||
			scribe.status === "connecting" ||
			scribe.status === "transcribing";
		if (!wasActive) {
			return lastFinalizedRef.current;
		}
		const finalized = joinSpoken(
			baseTextRef.current,
			spokenFromScribe(
				scribe.committedTranscripts,
				scribe.partialTranscript,
			),
		);
		lastFinalizedRef.current = finalized;
		flushSync(() => {
			onTextChange(finalized);
			setListening(false);
			setStarting(false);
		});
		scribe.disconnect();
		return finalized;
	};

	const consume = () => {
		const result = lastFinalizedRef.current;
		lastFinalizedRef.current = null;
		return result;
	};

	const stop = () => {
		finalize();
		return consume();
	};

	const finalizeRef = useRef(finalize);
	finalizeRef.current = finalize;

	useImperativeHandle(ref, () => ({
		stop: () => {
			finalizeRef.current();
			return consume();
		},
	}));

	const start = async () => {
		if (starting || listening || scribe.isConnected) {
			return;
		}
		setStarting(true);
		try {
			const response = await fetch("/api/stt/token", { method: "POST" });
			const data = (await response.json()) as {
				token?: string;
				error?: string;
			};
			if (!response.ok || !data.token) {
				onError(data.error || "Could not start speech recognition");
				setStarting(false);
				return;
			}

			baseTextRef.current = textRef.current;
			lastFinalizedRef.current = null;
			scribe.clearTranscripts();
			setListening(true);
			await scribe.connect({
				token: data.token,
				microphone: {
					echoCancellation: true,
					noiseSuppression: true,
					autoGainControl: true,
				},
			});
			setStarting(false);
		} catch (error) {
			setListening(false);
			setStarting(false);
			onError(
				error instanceof Error
					? error.message
					: "Could not start speech recognition",
			);
		}
	};

	const active =
		listening ||
		scribe.isConnected ||
		scribe.status === "connecting" ||
		scribe.status === "transcribing";
	const connecting = starting || scribe.status === "connecting";

	useEffect(() => {
		if (!submitOnEnter || !active) {
			return;
		}

		const onKeyDown = (event: KeyboardEvent) => {
			if (
				event.key !== "Enter" ||
				event.shiftKey ||
				event.altKey ||
				event.ctrlKey ||
				event.metaKey ||
				event.isComposing ||
				event.repeat ||
				event.defaultPrevented
			) {
				return;
			}

			const form = buttonRef.current?.closest("form");
			if (!form) {
				return;
			}

			const target = event.target;
			if (target instanceof Node && !form.contains(target)) {
				return;
			}

			event.preventDefault();
			finalizeRef.current();

			const submitButton = form.querySelector(
				'button[type="submit"]',
			);
			if (
				submitButton instanceof HTMLButtonElement &&
				submitButton.disabled
			) {
				return;
			}

			form.requestSubmit();
		};

		window.addEventListener("keydown", onKeyDown, true);
		return () => {
			window.removeEventListener("keydown", onKeyDown, true);
		};
	}, [active, submitOnEnter]);

	return (
		<button
			ref={buttonRef}
			type="button"
			disabled={disabled && !active}
			onClick={() => {
				if (active) {
					stop();
					return;
				}
				void start();
			}}
			aria-label={active ? "Stop dictation" : "Dictate with microphone"}
			title={active ? "Stop dictation" : "Dictate"}
			aria-pressed={active}
			className={cn(
				"inline-flex size-10 items-center justify-center rounded-full transition-colors disabled:opacity-50",
				active
					? "bg-destructive/10 text-destructive hover:bg-destructive/15"
					: "text-muted-foreground hover:bg-muted hover:text-foreground",
			)}
		>
			{connecting ? (
				<CircleNotchIcon size={20} className="animate-spin" />
			) : active ? (
				<SquareIcon size={16} weight="fill" />
			) : (
				<MicrophoneIcon size={20} weight="duotone" />
			)}
		</button>
	);
}
