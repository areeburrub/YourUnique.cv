import { defineConfig } from "@trigger.dev/sdk/v3";
import { additionalFiles } from "@trigger.dev/build/extensions/core";
import type { BuildContext, BuildExtension } from "@trigger.dev/core/v3/build";

const TYPST_VERSION = "0.13.1";
const TYPST_BIN = "/usr/local/bin/typst";

function installTypst(): BuildExtension {
	return {
		name: "install-typst",
		onBuildComplete(context: BuildContext) {
			if (context.target === "dev") {
				return;
			}

			const archive = `typst-x86_64-unknown-linux-musl.tar.xz`;
			const url = `https://github.com/typst/typst/releases/download/v${TYPST_VERSION}/${archive}`;

			context.addLayer({
				id: "typst-cli",
				image: {
					instructions: [
						"RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates xz-utils fontconfig fonts-liberation fonts-cmu && rm -rf /var/lib/apt/lists/*",
						`RUN curl -fsSL ${url} -o /tmp/typst.tar.xz \\
&& tar -xJf /tmp/typst.tar.xz -C /tmp \\
&& mv /tmp/typst-x86_64-unknown-linux-musl/typst ${TYPST_BIN} \\
&& chmod +x ${TYPST_BIN} \\
&& rm -rf /tmp/typst.tar.xz /tmp/typst-x86_64-unknown-linux-musl \\
&& typst --version`,
					],
				},
				deploy: {
					env: {
						TYPST_PATH: TYPST_BIN,
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
			installTypst(),
		],
	},
});
