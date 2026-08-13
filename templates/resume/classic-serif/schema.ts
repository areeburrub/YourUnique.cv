export const schema = {
	"$schema": "https://json-schema.org/draft/2020-12/schema",
	"type": "object",
	"properties": {
		"name": {
			"type": "string",
			"minLength": 1
		},
		"email": {
			"type": "string",
			"minLength": 1
		},
		"phone": {
			"default": "",
			"type": "string"
		},
		"location": {
			"default": "",
			"type": "string"
		},
		"github": {
			"default": "",
			"description": "Host/path only, e.g. github.com/user — no https://",
			"type": "string"
		},
		"linkedin": {
			"default": "",
			"description": "Host/path only, e.g. linkedin.com/in/user — no https://",
			"type": "string"
		},
		"website": {
			"default": "",
			"description": "Host/path only, e.g. example.com — no https://",
			"type": "string"
		},
		"summary": {
			"type": "string",
			"minLength": 1
		},
		"experience": {
			"minItems": 1,
			"type": "array",
			"items": {
				"type": "object",
				"properties": {
					"company": {
						"type": "string",
						"minLength": 1
					},
					"companyUrl": {
						"description": "Full https URL for the company, if any",
						"type": "string"
					},
					"roles": {
						"minItems": 1,
						"type": "array",
						"items": {
							"type": "object",
							"properties": {
								"title": {
									"type": "string",
									"minLength": 1
								},
								"location": {
									"type": "string",
									"minLength": 1
								},
								"employment": {
									"description": "Real employment type only: \"Full-time\", \"Part-time\", \"Internship\", or \"Contract\". Omit if unknown — never invent placeholders.",
									"type": "string"
								},
								"startDate": {
									"type": "string",
									"minLength": 1,
									"description": "e.g. \"Aug 2025\""
								},
								"endDate": {
									"type": "string",
									"minLength": 1,
									"description": "e.g. \"Present\" or \"Jul 2025\""
								},
								"bullets": {
									"minItems": 1,
									"maxItems": 12,
									"type": "array",
									"items": {
										"type": "object",
										"properties": {
											"label": {
												"description": "Short bold label, e.g. \"LLM Systems\" or \"Billing\"",
												"type": "string"
											},
											"text": {
												"type": "string",
												"minLength": 1
											}
										},
										"required": [
											"text"
										],
										"additionalProperties": false
									}
								}
							},
							"required": [
								"title",
								"location",
								"startDate",
								"endDate",
								"bullets"
							],
							"additionalProperties": false
						},
						"description": "One or more roles at this company. Put multiple roles under the same company instead of repeating the company."
					}
				},
				"required": [
					"company",
					"roles"
				],
				"additionalProperties": false
			}
		},
		"skills": {
			"minItems": 1,
			"type": "array",
			"items": {
				"type": "object",
				"properties": {
					"category": {
						"type": "string",
						"minLength": 1
					},
					"items": {
						"type": "string",
						"minLength": 1,
						"description": "Comma-separated list, e.g. TypeScript, Python, SQL"
					}
				},
				"required": [
					"category",
					"items"
				],
				"additionalProperties": false
			}
		},
		"projects": {
			"default": [],
			"type": "array",
			"items": {
				"type": "object",
				"properties": {
					"name": {
						"type": "string",
						"minLength": 1
					},
					"url": {
						"description": "Host/path only for the project site, no https://",
						"type": "string"
					},
					"startDate": {
						"type": "string"
					},
					"endDate": {
						"type": "string"
					},
					"stack": {
						"description": "Comma-separated tech stack, e.g. Next.js, AWS, PostgreSQL",
						"type": "string"
					},
					"bullets": {
						"minItems": 1,
						"maxItems": 8,
						"type": "array",
						"items": {
							"type": "object",
							"properties": {
								"label": {
									"description": "Short bold label, e.g. \"LLM Systems\" or \"Billing\"",
									"type": "string"
								},
								"text": {
									"type": "string",
									"minLength": 1
								}
							},
							"required": [
								"text"
							],
							"additionalProperties": false
						}
					},
					"links": {
						"type": "array",
						"items": {
							"type": "object",
							"properties": {
								"label": {
									"type": "string",
									"minLength": 1
								},
								"url": {
									"type": "string",
									"minLength": 1,
									"description": "Full https URL"
								}
							},
							"required": [
								"label",
								"url"
							],
							"additionalProperties": false
						}
					}
				},
				"required": [
					"name",
					"bullets"
				],
				"additionalProperties": false
			}
		},
		"education": {
			"minItems": 1,
			"type": "array",
			"items": {
				"type": "object",
				"properties": {
					"school": {
						"type": "string",
						"minLength": 1
					},
					"location": {
						"type": "string",
						"minLength": 1
					},
					"degree": {
						"type": "string",
						"minLength": 1
					},
					"startDate": {
						"type": "string",
						"minLength": 1
					},
					"endDate": {
						"type": "string",
						"minLength": 1
					}
				},
				"required": [
					"school",
					"location",
					"degree",
					"startDate",
					"endDate"
				],
				"additionalProperties": false
			}
		}
	},
	"required": [
		"name",
		"email",
		"phone",
		"location",
		"github",
		"linkedin",
		"website",
		"summary",
		"experience",
		"skills",
		"projects",
		"education"
	],
	"additionalProperties": false
} as const satisfies Record<string, unknown>;
