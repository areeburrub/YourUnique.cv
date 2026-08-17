export function AuthDivider() {
	return (
		<div className="relative">
			<div className="absolute inset-0 flex items-center">
				<span className="w-full border-t border-border" />
			</div>
			<div className="relative flex justify-center text-[12px] uppercase tracking-[0.08em]">
				<span className="bg-card px-3 text-muted-soft">or</span>
			</div>
		</div>
	);
}
