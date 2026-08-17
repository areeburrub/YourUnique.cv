import { CheckIcon } from "@phosphor-icons/react/ssr";
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
		mode === "sign-up" ? "Start with your career story" : "Welcome back";
	const body =
		mode === "sign-up"
			? "Create an account, build your persona once, and generate resumes that fit the role you're applying to."
			: "Pick up your persona, drafts, and tailored PDFs where you left off.";

	return (
		<div className="grid min-h-dvh overflow-hidden bg-background md:grid-cols-[1.05fr_0.95fr] md:gap-2 md:p-2">
			<section className="relative hidden overflow-hidden bg-[#1c1816] text-[#f6f0ea] md:flex md:flex-col md:justify-end md:rounded-2xl">
				<div
					aria-hidden
					className="pointer-events-none absolute inset-0"
				>
					<div className="absolute top-[-6rem] left-[-4rem] size-[22rem] rounded-full bg-[#e36a58]/25 blur-3xl" />
					<div className="absolute right-[-5rem] bottom-[-4rem] size-[18rem] rounded-full bg-[#f2e8cf]/15 blur-3xl" />
				</div>
				<div className="relative z-10 max-w-lg px-10 py-12 lg:px-14 lg:py-16">
					<p className="text-[13px] font-medium tracking-[0.08em] text-[#e36a58] uppercase">
						{mode === "sign-up" ? "Get started" : "Sign in"}
					</p>
					<h2 className="font-display mt-4 text-[40px] leading-[48px] font-semibold tracking-[-0.8px] lg:text-[48px] lg:leading-[56px]">
						{headline}
					</h2>
					<p className="mt-4 text-base leading-7 text-[#b4a89e]">
						{body}
					</p>
					<ul className="mt-8 space-y-3.5">
						{points.map((item) => (
							<li
								key={item}
								className="flex items-start gap-3 text-[15px] leading-6 font-medium"
							>
								<span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#e36a58]/15 text-[#e36a58]">
									<CheckIcon size={14} weight="bold" />
								</span>
								{item}
							</li>
						))}
					</ul>
				</div>
			</section>

			<section className="relative flex min-h-dvh flex-col overflow-y-auto bg-card md:min-h-0 md:rounded-2xl md:shadow-sm">
				<div className="flex items-center justify-between px-5 py-5 sm:px-8">
					<BrandLogo />
					<div className="flex items-center gap-2">
						<ModeToggle />
						<Link
							href="/"
							className="text-[14px] font-medium text-muted-foreground transition-colors hover:text-foreground"
						>
							Home
						</Link>
					</div>
				</div>
				<div className="flex flex-1 items-center justify-center px-5 py-8 sm:px-8">
					<div className="w-full max-w-[400px]">{children}</div>
				</div>
			</section>
		</div>
	);
}
