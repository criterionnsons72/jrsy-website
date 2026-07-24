'use client';

/** Read an image file's pixel dimensions in the browser. */
export function readImageMeta(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read the image.'));
    };
    img.src = url;
  });
}

/**
 * Upload a file directly to object storage using a short-lived presigned URL.
 * The bytes never pass through our API. Returns the stored object key.
 */
export async function uploadViaPresign(
  file: File,
  purpose: 'tryon' | 'scan' | 'attachment',
  token: string,
): Promise<string> {
  const presignRes = await fetch('/api/v1/storage/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ purpose, contentType: file.type }),
  });
  if (!presignRes.ok) {
    const err = await presignRes.json().catch(() => ({}));
    throw new Error(err?.message ?? 'Could not get an upload URL.');
  }
  const { url, key, headers } = await presignRes.json();

  const put = await fetch(url, { method: 'PUT', headers, body: file });
  if (!put.ok) throw new Error('Upload failed.');
  return key as string;
}
