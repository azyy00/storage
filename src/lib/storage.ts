import type { AppSupabaseClient } from "@/lib/supabaseClient";
import {
  BOT_STORAGE_BUCKET,
} from "@/lib/constants";
import { sanitizeFileName, slugify } from "@/lib/file-utils";

export function buildStoragePath(params: {
  userId: string;
  year: string;
  category: string;
  fileName: string;
}) {
  const normalizedFileName = sanitizeFileName(params.fileName);

  return [
    params.userId,
    slugify(params.year) || "unknown-year",
    slugify(params.category) || "uncategorized",
    normalizedFileName,
  ].join("/");
}

export async function uploadFileToStorage(params: {
  supabase: AppSupabaseClient;
  userId: string;
  file: File;
  year: string;
  category: string;
  fileName: string;
}) {
  const filePath = buildStoragePath({
    userId: params.userId,
    year: params.year,
    category: params.category,
    fileName: params.fileName,
  });

  const { error } = await params.supabase.storage
    .from(BOT_STORAGE_BUCKET)
    .upload(filePath, params.file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw error;
  }

  return filePath;
}

export async function createSignedDownloadUrl(params: {
  supabase: AppSupabaseClient;
  filePath: string;
  downloadName: string;
}) {
  const { data, error } = await params.supabase.storage
    .from(BOT_STORAGE_BUCKET)
    .createSignedUrl(params.filePath, 60, {
      download: params.downloadName,
    });

  if (error) {
    throw error;
  }

  return data.signedUrl;
}

export async function createSignedPreviewUrl(params: {
  supabase: AppSupabaseClient;
  filePath: string;
}) {
  const { data, error } = await params.supabase.storage
    .from(BOT_STORAGE_BUCKET)
    .createSignedUrl(params.filePath, 60);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}

export async function downloadStoredFile(params: {
  supabase: AppSupabaseClient;
  filePath: string;
}) {
  const { data, error } = await params.supabase.storage
    .from(BOT_STORAGE_BUCKET)
    .download(params.filePath);

  if (error) {
    throw error;
  }

  return data;
}

export async function moveStoredFile(params: {
  supabase: AppSupabaseClient;
  sourcePath: string;
  destinationPath: string;
}) {
  const { error } = await params.supabase.storage
    .from(BOT_STORAGE_BUCKET)
    .move(params.sourcePath, params.destinationPath);

  if (error) {
    throw error;
  }

  return params.destinationPath;
}

export async function deleteStoredFile(params: {
  supabase: AppSupabaseClient;
  filePath: string;
}) {
  const { error } = await params.supabase.storage
    .from(BOT_STORAGE_BUCKET)
    .remove([params.filePath]);

  if (error) {
    throw error;
  }
}
