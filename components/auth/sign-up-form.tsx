"use client";

import { useSignUp } from "@clerk/nextjs/legacy";
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

export function SignUpForm({ plan }: { plan?: string }) {
	const { isLoaded, signUp, setActive } = useSignUp();
	const afterAuth = afterAuthPath(plan);
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [emailAddress, setEmailAddress] = useState("");
	const [password, setPassword] = useState("");
	const [code, setCode] = useState("");
	const [verifying, setVerifying] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isGoogleLoading, setIsGoogleLoading] = useState(false);
	const [isResending, setIsResending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [passwordError, setPasswordError] = useState<string | null>(null);
	const [isPasswordFocused, setIsPasswordFocused] = useState(false);
	const lastAttemptedCodeRef = useRef<string | null>(null);

	const finish = useCallback(
		async (sessionId: string | null) => {
			if (!sessionId || !setActive) {
				setError("Unable to complete sign up. Please try again.");
				return;
			}

			await setActive({ session: sessionId });
			trackEvent(
				MixpanelEvent.SignUpCompleted,
				{
					method: "email",
					plan: plan || null,
				},
				{ sendImmediately: true },
			);
			window.location.href = afterAuth;
		},
		[afterAuth, plan, setActive],
	);

	const oauthUrls = useCallback(() => {
		const origin = window.location.origin;
		return {
			redirectUrl: `${origin}/sso-callback`,
			redirectUrlComplete: `${origin}${afterAuth}`,
		};
	}, [afterAuth]);

	const handleSubmit = async (event?: React.FormEvent) => {
		event?.preventDefault();

		if (isLoading) {
			return;
		}

		setError(null);
		setPasswordError(null);

		if (!isLoaded || !signUp) {
			setError("Sign up is still loading. Please try again.");
			return;
		}

		setIsLoading(true);
		trackEvent(MixpanelEvent.SignUpStarted, {
			method: "email",
			plan: plan || null,
		});

		try {
			const created = await signUp.create({
				firstName,
				lastName,
				emailAddress,
				password,
			});

			if (created.status === "complete") {
				await finish(created.createdSessionId);
				return;
			}

			if (created.unverifiedFields?.includes("email_address")) {
				await signUp.prepareEmailAddressVerification({
					strategy: "email_code",
				});
				setVerifying(true);
				return;
			}

			if (created.protectCheck) {
				setError("Please complete the verification challenge, then try again.");
				return;
			}

			const missing = (created.missingFields ?? []).filter(
				(field) => field !== "email_address",
			);
			setError(
				missing.length > 0
					? `Please complete: ${missing.join(", ")}`
					: "Could not create your account. Please try again.",
			);
		} catch (err: unknown) {
			const message = getClerkErrorMessage(
				err,
				"Could not create your account. Please try again.",
			);
			const lower = message.toLowerCase();

			if (
				lower.includes("password") ||
				lower.includes("character") ||
				lower.includes("8 characters")
			) {
				setPasswordError(message);
			} else {
				setError(message);
			}
		} finally {
			setIsLoading(false);
		}
	};

	const handleResendCode = async () => {
		setError(null);
		setIsResending(true);

		if (!isLoaded || !signUp) {
			setIsResending(false);
			return;
		}

		try {
			await signUp.prepareEmailAddressVerification({
				strategy: "email_code",
			});
		} catch (err: unknown) {
			setError(
				getClerkErrorMessage(err, "Failed to resend code. Please try again."),
			);
		} finally {
			setIsResending(false);
		}
	};

	const handleVerify = async (event?: React.FormEvent) => {
		event?.preventDefault();

		if (code.length !== 6 || isLoading || !isLoaded || !signUp) {
			return;
		}

		setError(null);
		setIsLoading(true);

		try {
			const attempt = await signUp.attemptEmailAddressVerification({
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

		if (code.length !== 6 || !isLoaded || lastAttemptedCodeRef.current === code) {
			return;
		}

		lastAttemptedCodeRef.current = code;
		void handleVerify();
	}, [code, isLoaded]);

	if (verifying) {
		return (
			<EmailVerificationOtp
				email={emailAddress}
				code={code}
				onCodeChange={setCode}
				onResend={handleResendCode}
				onChangeEmail={() => {
					setVerifying(false);
					setCode("");
					setError(null);
				}}
				error={error}
				isLoading={isLoading}
				isResending={isResending}
				onSubmit={handleVerify}
			/>
		);
	}

	return (
		<div className="w-full">
			<AuthFormHeading
				title="Create your account"
				subtitle="Build your persona once, then tailor a resume for every role."
			/>
			<div className="mt-8 space-y-4">
				<GoogleOAuthButton
					loading={isGoogleLoading}
					disabled={!isLoaded || !signUp}
					onClick={async () => {
						if (!signUp || isGoogleLoading) {
							return;
						}
						setIsGoogleLoading(true);
						setError(null);
						trackEvent(
							MixpanelEvent.OAuthGoogleStarted,
							{
								flow: "sign-up",
								plan: plan || null,
							},
							{ sendImmediately: true },
						);
						try {
							await signUp.authenticateWithRedirect({
								strategy: "oauth_google",
								continueSignIn: true,
								continueSignUp: true,
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
				<form
					onSubmit={(event) => void handleSubmit(event)}
					noValidate
					className="flex flex-col gap-3"
				>
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-2">
							<Label htmlFor="firstName">First name</Label>
							<Input
								id="firstName"
								type="text"
								autoComplete="given-name"
								placeholder="Ada"
								value={firstName}
								onChange={(event) => setFirstName(event.target.value)}
								required
								disabled={isLoading}
								className="h-12"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="lastName">Last name</Label>
							<Input
								id="lastName"
								type="text"
								autoComplete="family-name"
								placeholder="Lovelace"
								value={lastName}
								onChange={(event) => setLastName(event.target.value)}
								required
								disabled={isLoading}
								className="h-12"
							/>
						</div>
					</div>
					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							type="email"
							autoComplete="email"
							placeholder="you@email.com"
							value={emailAddress}
							onChange={(event) => setEmailAddress(event.target.value)}
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
								setPasswordError(null);
							}}
							disabled={isLoading}
							autoComplete="new-password"
							onFocus={() => setIsPasswordFocused(true)}
							onBlur={() => setIsPasswordFocused(false)}
						/>
						<p
							className={`overflow-hidden text-sm transition-all ${
								isPasswordFocused || passwordError
									? "max-h-12 opacity-100"
									: "max-h-0 opacity-0"
							} ${passwordError ? "text-destructive" : "text-muted-foreground"}`}
						>
							{passwordError || "Use 8 or more characters."}
						</p>
					</div>
					<div
						id="clerk-captcha"
						data-cl-theme="auto"
						data-cl-size="flexible"
					/>
					<FormError error={error} />
					<Button
						type="submit"
						size="lg"
						className="w-full"
						disabled={
							isLoading ||
							!isLoaded ||
							!signUp ||
							!firstName ||
							!lastName ||
							!emailAddress ||
							!password
						}
					>
						{isLoading ? <Spinner /> : null}
						{isLoading ? "Please wait" : "Create account"}
					</Button>
				</form>
				<p className="pt-1 text-center text-sm text-muted-foreground">
					Already have an account?{" "}
					<Link href={authPageHref("/sign-in", plan)} className="font-medium text-brand hover:underline">
						Sign in
					</Link>
				</p>
			</div>
		</div>
	);
}
