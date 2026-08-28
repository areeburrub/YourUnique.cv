import { ImageResponse } from "next/og";

import { BRAND, LOGO_MARK_PATH } from "@/lib/brand";
import { SITE_NAME } from "@/lib/site";

export const ogImageSize = {
	width: 1200,
	height: 630,
};

export const ogImageHighResSize = {
	width: 2400,
	height: 1260,
};

export const ogHeadline = "Every job is different. Why send the same CV?";
export const ogSubcopy =
	"Start from your resume and LinkedIn. Share a job in chat and get a CV written for that role, plus an ATS read.";
export const ogImageAlt = `${SITE_NAME}. ${ogHeadline}`;
export const ogImageContentType = "image/png";
export const ogImagePath = "/og.png";
export const ogImageHighResPath = "/og-2x.png";

const ATS_ROWS = [
	{ area: "TypeScript / React", match: "9/10" },
	{ area: "GraphQL", match: "8/10" },
	{ area: "Platform ownership", match: "8/10" },
	{ area: "JD keyword alignment", match: "76/100" },
] as const;

export function createOgImage(scale = 1) {
	const n = (value: number) => Math.round(value * scale);

	return new ImageResponse(
		(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					alignItems: "stretch",
					backgroundColor: BRAND.cream,
					padding: n(40),
				}}
			>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						width: n(380),
						flexShrink: 0,
					}}
				>
					<div style={{ display: "flex", alignItems: "center" }}>
						<svg
							width={n(40)}
							height={n(40)}
							viewBox="0 0 29 29"
							fill="none"
						>
							<path d={LOGO_MARK_PATH} fill={BRAND.terracotta} />
						</svg>
						<div
							style={{
								marginLeft: n(10),
								fontSize: n(24),
								fontWeight: 600,
								letterSpacing: "-0.04em",
								color: BRAND.ink,
							}}
						>
							{SITE_NAME}
						</div>
					</div>
					<div
						style={{
							marginTop: n(20),
							fontSize: n(36),
							fontWeight: 600,
							lineHeight: 1.15,
							letterSpacing: "-0.035em",
							color: BRAND.ink,
						}}
					>
						{ogHeadline}
					</div>
					<div
						style={{
							marginTop: n(14),
							fontSize: n(18),
							lineHeight: 1.4,
							color: "#6B635B",
						}}
					>
						{ogSubcopy}
					</div>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							marginTop: n(20),
							width: n(168),
							height: n(46),
							borderRadius: 999,
							backgroundColor: BRAND.terracotta,
							color: BRAND.paper,
							fontSize: n(18),
							fontWeight: 600,
						}}
					>
						Start free
					</div>
				</div>

				<div
					style={{
						display: "flex",
						flexDirection: "column",
						width: n(712),
						height: n(550),
						marginLeft: n(28),
						backgroundColor: BRAND.paper,
						border: "1px solid #E4D9CE",
						borderRadius: n(16),
						padding: n(22),
					}}
				>
					<div style={{ display: "flex", flexDirection: "column" }}>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								alignSelf: "flex-end",
								borderRadius: n(10),
								backgroundColor: "#EDE6DC",
								padding: `${n(8)}px ${n(10)}px`,
							}}
						>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									width: n(28),
									height: n(28),
									borderRadius: n(5),
									backgroundColor: "#0A66C2",
									color: "#FFFFFF",
									fontSize: n(11),
									fontWeight: 700,
								}}
							>
								in
							</div>
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									marginLeft: n(8),
								}}
							>
								<div
									style={{
										fontSize: n(15),
										fontWeight: 600,
										color: BRAND.ink,
									}}
								>
									linkedin.com/jobs/view/4128…
								</div>
								<div
									style={{
										fontSize: n(12),
										color: "#6B635B",
										marginTop: n(1),
									}}
								>
									Job posting
								</div>
							</div>
						</div>
						<div
							style={{
								display: "flex",
								alignSelf: "flex-end",
								marginTop: n(8),
								borderRadius: n(10),
								backgroundColor: "#EDE6DC",
								color: BRAND.ink,
								fontSize: n(16),
								padding: `${n(8)}px ${n(12)}px`,
							}}
						>
							Tailor my resume for this
						</div>
						<div
							style={{
								display: "flex",
								marginTop: n(10),
								fontSize: n(14),
								color: "#6B635B",
							}}
						>
							3 steps completed
						</div>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								alignSelf: "flex-start",
								marginTop: n(8),
								borderRadius: n(10),
								backgroundColor: "#EDE6DC",
								padding: `${n(8)}px ${n(10)}px`,
							}}
						>
							<div
								style={{
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									width: n(30),
									height: n(30),
									borderRadius: n(5),
									backgroundColor: "#E53935",
									color: "#FFFFFF",
									fontSize: n(10),
									fontWeight: 700,
								}}
							>
								PDF
							</div>
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									marginLeft: n(8),
								}}
							>
								<div
									style={{
										fontSize: n(15),
										fontWeight: 600,
										color: BRAND.ink,
									}}
								>
									Product Engineer - Northline.pdf
								</div>
								<div
									style={{
										fontSize: n(12),
										color: "#6B635B",
										marginTop: n(1),
									}}
								>
									PDF ready
								</div>
							</div>
						</div>
						<div
							style={{
								display: "flex",
								marginTop: n(10),
								fontSize: n(15),
								lineHeight: 1.35,
								color: BRAND.ink,
							}}
						>
							Draft is ready. GraphQL and ownership match this posting.
						</div>
					</div>

					<div
						style={{
							display: "flex",
							flexDirection: "column",
							marginTop: n(14),
						}}
					>
						<div
							style={{
								display: "flex",
								width: "100%",
								justifyContent: "space-between",
								alignItems: "flex-end",
								borderTop: "1px solid #E4D9CE",
								paddingTop: n(12),
							}}
						>
							<div style={{ display: "flex", flexDirection: "column" }}>
								<div
									style={{
										fontSize: n(16),
										fontWeight: 600,
										color: BRAND.ink,
									}}
								>
									ATS Analysis
								</div>
								<div
									style={{
										fontSize: n(13),
										color: "#6B635B",
										marginTop: n(2),
									}}
								>
									Product Engineer at Northline
								</div>
							</div>
							<div
								style={{
									flexShrink: 0,
									marginLeft: n(16),
									fontSize: n(18),
									fontWeight: 700,
									color: BRAND.terracotta,
								}}
							>
								84/100
							</div>
						</div>
						{ATS_ROWS.map((row) => (
							<div
								key={row.area}
								style={{
									display: "flex",
									width: "100%",
									justifyContent: "space-between",
									borderTop: "1px solid #E4D9CE",
									marginTop: n(6),
									paddingTop: n(6),
									fontSize: n(14),
									color: BRAND.ink,
								}}
							>
								<div>{row.area}</div>
								<div style={{ flexShrink: 0, marginLeft: n(16) }}>
									{row.match}
								</div>
							</div>
						))}
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								marginTop: n(8),
								borderRadius: n(8),
								backgroundColor: "#F3DDD6",
								padding: `${n(8)}px ${n(10)}px`,
							}}
						>
							<div
								style={{
									fontSize: n(13),
									fontWeight: 600,
									color: BRAND.ink,
								}}
							>
								Biggest gaps
							</div>
							<div
								style={{
									marginTop: n(2),
									fontSize: n(13),
									color: "#6B635B",
								}}
							>
								Kubernetes · SOC 2 reviews · multi-team staffing
							</div>
						</div>
					</div>
				</div>
			</div>
		),
		{
			width: n(ogImageSize.width),
			height: n(ogImageSize.height),
		},
	);
}

export function createAppIcon(size: number) {
	const mark = Math.round(size * 0.62);
	return new ImageResponse(
		(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: BRAND.cream,
				}}
			>
				<svg
					width={mark}
					height={mark}
					viewBox="0 0 29 29"
					fill="none"
				>
					<path d={LOGO_MARK_PATH} fill={BRAND.terracotta} />
				</svg>
			</div>
		),
		{
			width: size,
			height: size,
		},
	);
}
