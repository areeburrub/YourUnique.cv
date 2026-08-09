import { defineConfig } from "@trigger.dev/sdk/v3";
import { additionalFiles } from "@trigger.dev/build/extensions/core";
import type { BuildContext, BuildExtension } from "@trigger.dev/core/v3/build";

const TECTONIC_VERSION = "0.15.0";
const TECTONIC_BIN = "/usr/local/bin/tectonic";

function installTectonic(): BuildExtension {
	return {
		name: "install-tectonic",
		onBuildComplete(context: BuildContext) {
			if (context.target === "dev") {
				return;
			}

			const archive = `tectonic-${TECTONIC_VERSION}-x86_64-unknown-linux-gnu.tar.gz`;
			const url = `https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%40${TECTONIC_VERSION}/${archive}`;

			context.addLayer({
				id: "tectonic-cli",
				image: {
					instructions: [
						"RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates fontconfig && rm -rf /var/lib/apt/lists/*",
						`RUN curl -fsSL ${url} -o /tmp/tectonic.tar.gz \\
&& tar -xzf /tmp/tectonic.tar.gz -C /usr/local/bin tectonic \\
&& chmod +x ${TECTONIC_BIN} \\
&& rm /tmp/tectonic.tar.gz \\
&& tectonic --version`,
					],
				},
				deploy: {
					env: {
						TECTONIC_PATH: TECTONIC_BIN,
					},
					override: true,
				},
			});
		},
	};
}

export default defineConfig({
	project: "proj_cldbvyftqkvnjngyjhlp",
	runtime: "node",
	logLevel: "log",
	maxDuration: 3600,
	legacyDevProcessCwdBehaviour: false,
	retries: {
		enabledInDev: true,
		default: {
			maxAttempts: 3,
			minTimeoutInMs: 1000,
			maxTimeoutInMs: 10000,
			factor: 2,
			randomize: true,
		},
	},
	dirs: ["trigger"],
	build: {
		extensions: [
			additionalFiles({ files: ["./templates/resume/**"] }),
			installTectonic(),
		],
	},
});
