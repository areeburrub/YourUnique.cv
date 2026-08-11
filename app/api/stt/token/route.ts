import { auth } from "@clerk/nextjs/server";

export async function POST() {
	const { userId } = await auth();
	if (!userId) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const apiKey = process.env.ELEVENLABS_API_KEY;
	if (!apiKey) {
		return Response.json(
			{ error: "Speech recognition is not configured" },
			{ status: 503 },
		);
	}

	const response = await fetch(
		"https://api.elevenlabs.io/v1/single-use-token/realtime_scribe",
		{
			method: "POST",
			headers: {
				"xi-api-key": apiKey,
			},
		},
	);

	if (!response.ok) {
		return Response.json(
			{ error: "Could not start speech recognition" },
			{ status: 502 },
		);
	}

	const data = (await response.json()) as { token?: string };
	if (!data.token) {
		return Response.json(
			{ error: "Could not start speech recognition" },
			{ status: 502 },
		);
	}

	return Response.json({ token: data.token });
}
