import {
	type ResumeBullet,
	type ResumeDocument,
	stripUrlScheme,
} from "@/lib/resume-document";

function typstString(value: string) {
	return JSON.stringify(value);
}

/** Markup-mode insert: use only outside code (e.g. list items, section body). */
function typstText(value: string) {
	return `#(${typstString(value)})`;
}

function datesHelper(startDate: string, endDate: string) {
	return `dates-helper(start-date: ${typstString(startDate)}, end-date: ${typstString(endDate)})`;
}

function employmentValue(employment?: string) {
	const trimmed = employment?.trim() ?? "";
	if (!trimmed || /not specified|unknown|n\/a|^none$/i.test(trimmed)) {
		return "";
	}
	return trimmed;
}

function renderBullet(bullet: ResumeBullet) {
	const label = "label" in bullet ? bullet.label?.trim() : undefined;
	if (label) {
		return `- *${label.replaceAll("*", "")}:* ${typstText(bullet.text)}`;
	}
	return `- ${typstText(bullet.text)}`;
}

function renderBullets(bullets: ResumeBullet[]) {
	return bullets.map(renderBullet).join("\n");
}

export function renderResumeTypst(document: ResumeDocument): string {
	const github = stripUrlScheme(document.github ?? "");
	const linkedin = stripUrlScheme(document.linkedin ?? "");
	const website = stripUrlScheme(document.website ?? "");

	const experienceBlocks = document.experience
		.map((company) => {
			const header = company.companyUrl?.trim()
				? `#company-header(${typstString(company.company)}, url: ${typstString(company.companyUrl.trim())})`
				: `#company-header(${typstString(company.company)})`;

			const roles = company.roles
				.map((role) => {
					const employment = employmentValue(role.employment);
					const args = [
						`title: ${typstString(role.title)}`,
						`location: ${typstString(role.location)}`,
						`dates: ${datesHelper(role.startDate, role.endDate)}`,
					];
					if (employment) {
						args.splice(2, 0, `employment: ${typstString(employment)}`);
					}

					const bullets = role.bullets.map(renderBullet).join("\n    ");
					return [
						`#role-entry(`,
						`    ${args.join(",\n    ")},`,
						`)[`,
						`    ${bullets}`,
						`]`,
					].join("\n");
				})
				.join("\n#v(2pt)\n");

			return `${header}\n${roles}`;
		})
		.join("\n#v(2pt)\n");

	const skillsBlock = document.skills
		.map(
			(skill) =>
				`- *${skill.category.replaceAll("*", "")}:* ${typstText(skill.items)}`,
		)
		.join("\n");

	const projectsBlock =
		document.projects.length === 0
			? ""
			: [
					"",
					"== Projects",
					...document.projects.map((project) => {
						const hasDates = Boolean(project.startDate && project.endDate);
						const url = project.url ? stripUrlScheme(project.url) : "";
						const lines = [
							`#project(`,
							`    name: ${typstString(project.name)},`,
						];
						if (url) {
							lines.push(`    url: ${typstString(url)},`);
						}
						if (hasDates) {
							lines.push(
								`    dates: ${datesHelper(project.startDate!, project.endDate!)},`,
							);
						}
						lines.push(`)`);
						lines.push(`#pad(left: 0.05in, bottom: 3pt)[`);
						lines.push(`  #set list(spacing: 0.55em, tight: true)`);
						lines.push(`  #set par(leading: 0.38em)`);
						if (project.stack?.trim()) {
							lines.push(
								`  - *Stack:* ${typstText(project.stack.trim())}`,
							);
						}
						for (const bullet of project.bullets) {
							lines.push(`  ${renderBullet(bullet)}`);
						}
						if (project.links?.length) {
							const linkBits = project.links
								.map(
									(link) =>
										`#link(${typstString(link.url)})[${typstText(link.label)}]`,
								)
								.join(", ");
							lines.push(`  - Links: ${linkBits}`);
						}
						lines.push(`]`);
						return lines.join("\n");
					}),
				].join("\n");

	const educationBlocks = document.education
		.map((edu) => {
			return [
				`#edu(`,
				`    institution: ${typstString(edu.school)},`,
				`    location: ${typstString(edu.location)},`,
				`    dates: ${datesHelper(edu.startDate, edu.endDate)},`,
				`    degree: ${typstString(edu.degree)},`,
				`    consistent: true,`,
				`)`,
			].join("\n");
		})
		.join("\n\n");

	return `#import "lib.typ": *

#show: resume.with(
    author: ${typstString(document.name)},
    email: ${typstString(document.email)},
    github: ${typstString(github)},
    linkedin: ${typstString(linkedin)},
    phone: ${typstString(document.phone ?? "")},
    personal-site: ${typstString(website)},
    location: ${typstString(document.location ?? "")},
    accent-color: "#000080",
    paper: "a4",
    author-position: left,
    personal-info-position: left,
)

== Executive Summary
#set par(leading: 0.5em)
${typstText(document.summary)}

== Work Experience
${experienceBlocks}

== Skills
${skillsBlock}
${projectsBlock}

== Education
${educationBlocks}
`;
}
