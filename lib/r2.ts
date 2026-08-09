import {
	DeleteObjectCommand,
	GetObjectCommand,
	HeadObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function requiredEnv(name: string) {
	const value = process.env[name];
	if (!value) {
		throw new Error(`${name} is not set`);
	}
	return value;
}

let client: S3Client | null = null;

export function getR2Bucket() {
	return requiredEnv("R2_BUCKET_NAME");
}

export function getR2Client() {
	if (client) {
		return client;
	}

	client = new S3Client({
		region: "auto",
		endpoint: requiredEnv("R2_ENDPOINT"),
		credentials: {
			accessKeyId: requiredEnv("R2_ACCESS_KEY_ID"),
			secretAccessKey: requiredEnv("R2_SECRET_ACCESS_KEY"),
		},
	});

	return client;
}

export async function putR2Object(input: {
	key: string;
	body: Buffer | Uint8Array;
	contentType: string;
}) {
	await getR2Client().send(
		new PutObjectCommand({
			Bucket: getR2Bucket(),
			Key: input.key,
			Body: input.body,
			ContentType: input.contentType,
		}),
	);
}

export async function deleteR2Object(key: string) {
	await getR2Client().send(
		new DeleteObjectCommand({
			Bucket: getR2Bucket(),
			Key: key,
		}),
	);
}

export async function getR2Object(key: string) {
	return getR2Client().send(
		new GetObjectCommand({
			Bucket: getR2Bucket(),
			Key: key,
		}),
	);
}

export async function headR2Object(key: string) {
	return getR2Client().send(
		new HeadObjectCommand({
			Bucket: getR2Bucket(),
			Key: key,
		}),
	);
}

export async function getR2SignedGetUrl(key: string, expiresIn = 3600) {
	return getSignedUrl(
		getR2Client(),
		new GetObjectCommand({
			Bucket: getR2Bucket(),
			Key: key,
		}),
		{ expiresIn },
	);
}

export async function getR2SignedPutUrl(
	key: string,
	contentType: string,
	expiresIn = 600,
) {
	return getSignedUrl(
		getR2Client(),
		new PutObjectCommand({
			Bucket: getR2Bucket(),
			Key: key,
			ContentType: contentType,
		}),
		{ expiresIn },
	);
}
