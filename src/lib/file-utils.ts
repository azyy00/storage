import {
  FileCode2,
  FileSpreadsheet,
  FileText,
  type LucideIcon,
} from "lucide-react";

import { BOT_DEFAULT_YEARS } from "@/lib/constants";
import type { BotFileRecord } from "@/types/database";

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function sanitizeFileName(value: string) {
  return value
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ");
}

export function detectFileType(fileName: string) {
  const extension = fileName.split(".").pop()?.trim().toUpperCase();
  return extension && extension !== fileName.toUpperCase() ? extension : "FILE";
}

export function formatFileSize(bytes: number | null) {
  if (!bytes || Number.isNaN(bytes)) {
    return "Unknown";
  }

  if (bytes >= 1024 ** 3) {
    return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  }

  if (bytes >= 1024 ** 2) {
    return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  }

  if (bytes >= 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${bytes} B`;
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function formatDateStamp(value: string) {
  const date = new Date(value);
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getFileIcon(fileType: string | null): LucideIcon {
  switch ((fileType ?? "").toUpperCase()) {
    case "CSV":
    case "XLSX":
      return FileSpreadsheet;
    case "JSON":
    case "XML":
    case "YAML":
    case "TXT":
      return FileCode2;
    default:
      return FileText;
  }
}

export function getCategoryTone(category: string) {
  const tones: Record<string, string> = {
    Automation: "border-sky-200 bg-sky-50 text-sky-700",
    "Training Data": "border-cyan-200 bg-cyan-50 text-cyan-700",
    Deployment: "border-indigo-200 bg-indigo-50 text-indigo-700",
    "Prompt Library": "border-blue-200 bg-blue-50 text-blue-700",
    Reports: "border-slate-200 bg-slate-100 text-slate-700",
    Reference: "border-teal-200 bg-teal-50 text-teal-700",
  };

  return tones[category] ?? "border-slate-200 bg-slate-100 text-slate-700";
}

export function buildYearOptions(files: BotFileRecord[]) {
  return Array.from(
    new Set([...BOT_DEFAULT_YEARS, ...files.map((file) => file.year)]),
  ).sort((a, b) => Number(b) - Number(a));
}

export function buildStoragePathLabel(filePath: string) {
  return `/${filePath}`;
}

export function getInitials(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return "BD";
  }

  if (normalized.includes("@")) {
    const [local] = normalized.split("@");
    return local.slice(0, 2).toUpperCase();
  }

  return normalized
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}
