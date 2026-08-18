"use client";

import { useSignIn } from "@clerk/nextjs/legacy";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { afterAuthPath, authPageHref } from "@/lib/auth-redirect";
import { getClerkErrorMessage } from "@/lib/clerk-error";
import { MixpanelEvent, trackEvent } from "@/lib/mixpanel";

import { AuthDivider } from "./auth-divider";
import { AuthFormHeading } from "./auth-form-heading";
import { EmailVerificationOtp } from "./email-verification-otp";
import { FormError } from "./form-error";
import { GoogleOAuthButton } from "./google-oauth-button";
import { PasswordField } from "./password-field";

export function SignInForm({ plan }: { plan?: string }) {
	const { isLoaded, signIn, setActive } = useSignIn();
	const afterAuth = afterAuthPath(plan);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [code, setCode] = useState("");
	const [emailAddressId, setEmailAddressId] = useState<string | null>(null);
	const [showEmailCode, setShowEmailCode] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isGoogleLoading, setIsGoogleLoading] = useState(false);
	const [isResending, setIsResending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const lastAttemptedCodeRef = useRef<string | null>(null);

	const finish = useCallback(
		async (sessionId: string | null) => {
			if (!sessionId || !setActive) {
				setError("Unable to complete sign in. Please try again.");
				return;
			}

			await setActive({ session: sessionId });
			trackEvent(
				MixpanelEvent.SignInCompleted,
				{ method: "email" },
				{ sendImmediately: true },
			);
			window.location.href = afterAuth;
		},
		[afterAuth, setActive],
	);

	const oauthUrls = useCallback(() => {
		const origin = window.location.origin;
		return {
			redirectUrl: `${origin}/sso-callback`,
			redirectUrlComplete: `${origin}${afterAuth}`,
		};
	}, [afterAuth]);

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		setError(null);
		setIsLoading(true);
		trackEvent(MixpanelEvent.SignInStarted, { method: "email" });

		if (!isLoaded || !signIn) {
			setIsLoading(false);
			return;
		}

		try {
			let attempt = await signIn.create({
				identifier: email,
				password,
			});

			if (attempt.status === "needs_first_factor") {
				attempt = await signIn.attemptFirstFactor({
					strategy: "password",
					password,
				});
			}

			if (attempt.status === "complete") {
				await finish(attempt.createdSessionId);
				return;
			}

			const emailCodeFactor = attempt.supportedFirstFactors?.find(
				(factor) =>
					factor.strategy === "email_code" && "emailAddressId" in factor,
			) as { strategy: "email_code"; emailAddressId: string } | undefined;

			if (emailCodeFactor) {
				await signIn.prepareFirstFactor({
					strategy: "email_code",
					emailAddressId: emailCodeFactor.emailAddressId,
				});
				setEmailAddressId(emailCodeFactor.emailAddressId);
				setShowEmailCode(true);
				return;
			}

			setError("Additional verification is required. Please try again.");
		} catch (err: unknown) {
			setError(
				getClerkErrorMessage(err, "Could not sign in. Please try again."),
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleResendCode = async () => {
		setError(null);
		setIsResending(true);

		if (!isLoaded || !signIn || !emailAddressId) {
			setIsResending(false);
			return;
		}

		try {
			await signIn.prepareFirstFactor({
				strategy: "email_code",
				emailAddressId,
			});
		} catch (err: unknown) {
			setError(
				getClerkErrorMessage(err, "Failed to resend code. Please try again."),
			);
		} finally {
			setIsResending(false);
		}
	};

	const handleCodeSubmit = async (event?: React.FormEvent) => {
		event?.preventDefault();

		if (code.length !== 6 || isLoading || !isLoaded || !signIn || !emailAddressId) {
			return;
		}

		setError(null);
		setIsLoading(true);

		try {
			const attempt = await signIn.attemptFirstFactor({
				strategy: "email_code",
				code,
			});

			if (attempt.status === "complete") {
				await finish(attempt.createdSessionId);
				return;
			}

			setError("Verification failed. Please check your code and try again.");
		} catch (err: unknown) {
			setError(getClerkErrorMessage(err, "Invalid code. Please try again."));
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (code.length < 6) {
			lastAttemptedCodeRef.current = null;
			return;
		}

		if (
			code.length !== 6 ||
			!isLoaded ||
			!emailAddressId ||
			lastAttemptedCodeRef.current === code
		) {
			return;
		}

		lastAttemptedCodeRef.current = code;
		void handleCodeSubmit();
	}, [code, emailAddressId, isLoaded]);

	if (showEmailCode) {
		return (
			<EmailVerificationOtp
				email={email}
				code={code}
				onCodeChange={setCode}
				onResend={handleResendCode}
				onChangeEmail={() => {
					setShowEmailCode(false);
					setCode("");
					setError(null);
				}}
				error={error}
				isLoading={isLoading}
				isResending={isResending}
				onSubmit={handleCodeSubmit}
			/>
		);
	}

	return (
		<div className="w-full">
			<AuthFormHeading
				title="Welcome back"
				subtitle="Pick up your persona, drafts, and tailored PDFs."
			/>
			<div className="mt-8 space-y-4">
				<GoogleOAuthButton
					loading={isGoogleLoading}
					disabled={!isLoaded || !signIn}
					onClick={async () => {
						if (!signIn || isGoogleLoading) {
							return;
						}
						setIsGoogleLoading(true);
						setError(null);
						trackEvent(
							MixpanelEvent.OAuthGoogleStarted,
							{
								flow: "sign-in",
							},
							{ sendImmediately: true },
						);
						try {
							await signIn.authenticateWithRedirect({
								strategy: "oauth_google",
								...oauthUrls(),
							});
						} catch (err: unknown) {
							setError(
								getClerkErrorMessage(
									err,
									"Failed to authenticate with Google",
								),
							);
							setIsGoogleLoading(false);
						}
					}}
				/>
				<AuthDivider />
				<form onSubmit={handleSubmit} className="flex flex-col gap-3">
					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							type="email"
							autoComplete="email"
							placeholder="you@email.com"
							value={email}
							onChange={(event) => {
								setEmail(event.target.value);
								setError(null);
							}}
							required
							disabled={isLoading}
							className="h-12"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="password">Password</Label>
						<PasswordField
							id="password"
							value={password}
							onChange={(value) => {
								setPassword(value);
								setError(null);
							}}
							disabled={isLoading}
						/>
					</div>
					<div id="clerk-captcha" className="min-h-0 shrink-0" />
					<FormError error={error} />
					<Button
						type="submit"
						size="lg"
						className="w-full"
						disabled={isLoading || !email || !password}
					>
						{isLoading ? <Spinner /> : null}
						{isLoading ? "Please wait" : "Sign in"}
					</Button>
				</form>
				<p className="pt-1 text-center text-sm text-muted-foreground">
					Don&apos;t have an account?{" "}
					<Link href={authPageHref("/sign-up", plan)} className="font-medium text-brand hover:underline">
						Sign up
					</Link>
				</p>
			</div>
		</div>
	);
}
