"use client";

import { CommitStrategy, useScribe } from "@elevenlabs/react";
import { LoaderCircle, Mic, Square } from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState } from "react";

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

type SpeechToTextButtonProps = {
	text: string;
	onTextChange: (value: string) => void;
	onError: (message: string) => void;
	disabled?: boolean;
};

export function SpeechToTextButton({
	text,
	onTextChange,
	onError,
	disabled,
}: SpeechToTextButtonProps) {
	const baseTextRef = useRef("");
	const textRef = useRef(text);
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

	const stop = () => {
		onTextChange(
			joinSpoken(
				baseTextRef.current,
				spokenFromScribe(
					scribe.committedTranscripts,
					scribe.partialTranscript,
				),
			),
		);
		scribe.disconnect();
		setListening(false);
		setStarting(false);
	};

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

	return (
		<button
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
				"inline-flex size-8 items-center justify-center rounded-lg transition-colors disabled:opacity-50",
				active
					? "bg-destructive/10 text-destructive hover:bg-destructive/15"
					: "text-muted-foreground hover:bg-muted hover:text-foreground",
			)}
		>
			{connecting ? (
				<LoaderCircle className="size-4 animate-spin" />
			) : active ? (
				<Square className="size-3.5 fill-current" />
			) : (
				<Mic className="size-4" />
			)}
		</button>
	);
}
