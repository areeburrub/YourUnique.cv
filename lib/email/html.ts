import { EMAIL_LOGO_URL, type EmailTemplateDef } from "@/lib/email/catalog";

const FONT =
	"Inter, Inter Tight, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, Helvetica, sans-serif";

export function buildTemplateHtml(template: EmailTemplateDef) {
	const paragraphs = template.paragraphs
		.map(
			(text) =>
				`<p style="margin:0 0 16px;font-size:16px;line-height:26px;color:#1C1816;">${text}</p>`,
		)
		.join("");

	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(template.name)}</title>
</head>
<body style="margin:0;padding:0;background:#F5F0EA;font-family:${FONT};color:#1C1816;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${template.preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0EA;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:100%;background:#FFFCF8;border:1px solid #E4D9CE;border-radius:20px;">
          <tr>
            <td style="padding:36px 40px 28px;">
              <a href="https://yourunique.cv" style="text-decoration:none;">
                <img src="${EMAIL_LOGO_URL}" width="40" height="40" alt="YourUnique.cv" style="display:block;border:0;border-radius:8px;">
              </a>
              <p style="margin:12px 0 0;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#6B635B;">YourUnique.cv</p>
              <h1 style="margin:28px 0 20px;font-family:Inter Tight, ${FONT};font-size:28px;line-height:34px;font-weight:600;letter-spacing:-0.8px;color:#1C1816;">${template.headline}</h1>
              ${paragraphs}
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;">
                <tr>
                  <td style="border-radius:999px;background:#C23B2E;">
                    <a href="{{{CTA_URL}}}" style="display:inline-block;padding:14px 28px;font-size:16px;line-height:16px;font-weight:500;color:#FFFCF8;text-decoration:none;border-radius:999px;">${template.ctaLabel}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px;">
              <p style="margin:24px 0 0;padding-top:20px;border-top:1px solid #E4D9CE;font-size:13px;line-height:20px;color:#6B635B;">
                YourUnique.cv · <a href="mailto:contact@areeburrub.dev" style="color:#6B635B;">contact@areeburrub.dev</a><br>
                <a href="{{{UNSUBSCRIBE_URL}}}" style="color:#6B635B;">Unsubscribe</a>
                · <a href="https://yourunique.cv/settings" style="color:#6B635B;">Notification settings</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(value: string) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");
}
