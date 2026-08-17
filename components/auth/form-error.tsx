export function FormError({ error }: { error: string | null }) {
	if (!error) {
		return null;
	}

	return (
		<p className="text-left text-sm text-destructive" role="alert">
			{error}
		</p>
	);
}
