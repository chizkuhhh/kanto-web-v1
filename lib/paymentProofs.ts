import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { randomBytes } from "crypto"
import { r2 } from "@/lib/r2"

const BUCKET = process.env.R2_PROOFS_BUCKET!
export const PROOF_MAX_BYTES = 5 * 1024 * 1024

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

export const PROOF_TYPES = Object.keys(EXTENSIONS)

// Step 1: a short-lived link the browser uploads the file to directly
export async function createProofUpload(contentType: string) {
  const ext = EXTENSIONS[contentType]
  if (!ext) throw new Error("Upload a JPG, PNG, or WebP image.")

  const key = `proofs/${randomBytes(16).toString("hex")}.${ext}`
  const url = await getSignedUrl(
    r2,
    new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType }),
    { expiresIn: 300 },
  )
  return { key, url }
}

// Step 2: check the file arrived, is an image, and is under the size limit
export async function verifyProof(key: string) {
  if (!key.startsWith("proofs/")) throw new Error("Invalid payment proof. Please upload it again.")

  let head
  try {
    head = await r2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }))
  } catch {
    throw new Error("We couldn't find your payment screenshot. Please upload it again.")
  }

  const tooBig = (head.ContentLength ?? 0) > PROOF_MAX_BYTES
  const wrongType = !PROOF_TYPES.includes(head.ContentType ?? "")
  if (tooBig || wrongType) {
    await deleteProof(key)
    throw new Error(
      tooBig
        ? "That image is over 5 MB. Please upload a smaller one."
        : "Upload a JPG, PNG, or WebP image.",
    )
  }
}

export async function deleteProof(key: string) {
  await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}

// Short-lived link for admin to view the screenshot
export function proofViewUrl(key: string) {
  return getSignedUrl(r2, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn: 600 })
}