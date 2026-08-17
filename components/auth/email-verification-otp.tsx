"use client";

import { REGEXP_ONLY_DIGITS } from "input-otp";

import { Button } from "@/components/ui/button";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from "@/components/ui/input-otp";
import { Spinner } from "@/components/ui/spinner";

import { FormError } from "./form-error";

type EmailVerificationOtpProps = {
	email: string;
	code: string;
	onCodeChange: (value: string) => void;
	onResend: () => void;
	onChangeEmail: () => void;
	error: string | null;
	isLoading: boolean;
	isResending: boolean;
	onSubmit: (event?: React.FormEvent) => void;
};

export function EmailVerificationOtp({
	email,
	code,
	onCodeChange,
	onResend,
	onChangeEmail,
	error,
	isLoading,
	isResending,
	onSubmit,
}: EmailVerificationOtpProps) {
	return (
		<div className="w-full space-y-5">
			<div className="text-center">
				<h2 className="font-display text-[26px] leading-8 font-semibold tracking-[-0.52px] text-foreground">
					Check your email
				</h2>
				<p className="mt-2 text-[15px] leading-6 text-muted-foreground">
					We sent a code to{" "}
					<span className="font-medium text-foreground">{email}</span>{" "}
					<button
						type="button"
						onClick={onChangeEmail}
						className="text-brand hover:underline"
					>
						(change)
					</button>
				</p>
			</div>
			<form onSubmit={onSubmit} className="space-y-4">
				<InputOTP
					id="code"
					maxLength={6}
					pattern={REGEXP_ONLY_DIGITS}
					value={code}
					onChange={onCodeChange}
					disabled={isLoading}
					autoFocus
					autoComplete="one-time-code"
					containerClassName="w-full"
				>
					<InputOTPGroup>
						{Array.from({ length: 6 }, (_, index) => (
							<InputOTPSlot
								key={index}
								index={index}
								aria-invalid={Boolean(error)}
							/>
						))}
					</InputOTPGroup>
				</InputOTP>
				<p className="text-center text-sm text-muted-foreground">
					Didn&apos;t get a code?{" "}
					<button
						type="button"
						onClick={onResend}
						disabled={isResending}
						className="font-medium text-brand hover:underline disabled:opacity-50"
					>
						{isResending ? "Sending..." : "Resend"}
					</button>
				</p>
				<FormError error={error} />
				<Button
					type="submit"
					size="lg"
					className="w-full"
					disabled={isLoading || code.length !== 6}
				>
					{isLoading ? <Spinner /> : null}
					{isLoading ? "Verifying..." : "Verify code"}
				</Button>
			</form>
		</div>
	);
}
