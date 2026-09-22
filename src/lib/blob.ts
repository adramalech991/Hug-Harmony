import { put, del } from "@vercel/blob";

export interface UploadResult {
  url: string;
  key: string;
  bucket: string;
}

// Upload file to Blob
export async function uploadToBlob(
  file: File | Buffer,
  key: string,
  contentType?: string
): Promise<UploadResult> {
  let body: Blob | Buffer;
  
  if (file instanceof File) {
    body = file;
  } else {
    body = file;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { url } = await put(key, body as any, { 
    access: 'public',
    contentType: contentType
  });

  return {
    url,
    key,
    bucket: "vercel-blob",
  };
}

// Upload with random suffix
export async function uploadToBlobWithRandomSuffix(
  file: File,
  prefix: string = ""
): Promise<UploadResult> {
  const extension = file.name.split(".").pop() || "";
  const randomId = crypto.randomUUID();
  const key = prefix
    ? `${prefix}/${randomId}${extension ? `.${extension}` : ""}`
    : `${randomId}${extension ? `.${extension}` : ""}`;

  const { url } = await put(key, file, { access: 'public' });
  
  return {
    url,
    key,
    bucket: "vercel-blob", // Vercel Blob abstracts the bucket name
  };
}

// Delete file by URL
export async function deleteFromBlobByUrl(url: string): Promise<void> {
  await del(url);
}
