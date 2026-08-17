import Link from "next/link";

import { BrandLogo } from "@/components/landing/brand-logo";
import { ModeToggle } from "@/components/mode-toggle";

const points = [
	"One career persona the agent can draw from",
	"Tailored drafts for every job description",
	"Clean PDF export with version history",
];

type AuthShellProps = {
	mode: "sign-in" | "sign-up";
	children: React.ReactNode;
};

export function AuthShell({ mode, children }: AuthShellProps) {
	const headline =
		mode === "sign-up"
			? "Start with your career story"
			: "Welcome back";
	const body =
		mode === "sign-up"
			? "Create an account, build your persona once, and generate resumes that fit the role you're applying to."
			: "Pick up your persona, drafts, and tailored PDFs where you left off.";

	return (
		<div className="flex min-h-full flex-1 flex-col bg-background">
			<header>
				<div className="rail flex h-16 items-center justify-between px-5 sm:px-8 md:h-[4.5rem] md:px-10">
					<BrandLogo />
					<div className="flex items-center gap-3">
						<ModeToggle />
						<Link
							href="/"
							className="text-[14px] font-medium text-muted-foreground transition-colors hover:text-foreground"
						>
							Back to home
						</Link>
					</div>
				</div>
			</header>

			<main className="flex flex-1 flex-col">
				<div className="rail flex flex-1 flex-col gap-6 px-5 pb-10 sm:px-8 md:px-10 lg:grid lg:grid-cols-2 lg:gap-8 lg:pb-14">
					<section className="relative flex flex-col justify-center overflow-hidden rounded-[32px] bg-pastel-blush px-6 py-12 sm:px-9 sm:py-16 md:px-10">
						<div className="relative max-w-[420px]">
							<p className="eyebrow !text-brand">
								{mode === "sign-up" ? "Get started" : "Sign in"}
							</p>
							<h1 className="font-display mt-4 text-[40px] leading-[48px] font-semibold tracking-[-0.8px] text-foreground sm:text-[48px] sm:leading-[56px] sm:tracking-[-0.96px]">
								{headline}
							</h1>
							<p className="mt-4 text-base leading-7 text-muted-foreground">
								{body}
							</p>
							<ul className="mt-8 hidden space-y-4 sm:block">
								{points.map((item) => (
									<li
										key={item}
										className="flex items-start gap-3 text-base font-medium text-foreground"
									>
										<span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-card text-[13px] text-brand">
											✓
										</span>
										{item}
									</li>
								))}
							</ul>
						</div>
					</section>

					<section className="flex flex-1 items-center justify-center rounded-[32px] bg-card px-5 py-12 sm:px-8 md:px-10">
						<div className="w-full max-w-[400px]">{children}</div>
					</section>
				</div>
			</main>
		</div>
	);
}
