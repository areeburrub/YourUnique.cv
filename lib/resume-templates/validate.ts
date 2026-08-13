import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";

const ajv = new Ajv2020({
	allErrors: true,
	strict: false,
	validateSchema: false,
});
addFormats(ajv);

export function validateAgainstJsonSchema(
	schema: Record<string, unknown>,
	data: unknown,
): Record<string, unknown> {
	const validate = ajv.compile(schema);
	const ok = validate(data);
	if (!ok) {
		const details = (validate.errors ?? [])
			.map((error) => `${error.instancePath || "/"} ${error.message ?? "invalid"}`)
			.join("; ");
		throw new Error(
			`Document does not match the selected template schema${details ? `: ${details}` : ""}`,
		);
	}
	return data as Record<string, unknown>;
}
