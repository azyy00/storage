import pdfWorkerUrl from "pdfjs-dist/legacy/build/pdf.worker.mjs?url";

import { BOT_SUMMARY_MODEL } from "@/lib/constants";
import type { AppSupabaseClient } from "@/lib/supabaseClient";

export type SummaryRequest = {
  name: string;
  year: string;
  category: string;
  description: string;
  extractedText?: string | null;
};

const MAX_SUMMARY_INPUT_LENGTH = 12_000;
const MAX_SUMMARIZABLE_FILE_SIZE = 10 * 1024 * 1024;
const MAX_PDF_PAGES = 8;
const GENERIC_SUMMARY_PATTERN =
  /^BOT file .+ from .+ in .+ was uploaded and stored for internal review\.?$/i;
const TEXT_FILE_EXTENSIONS = new Set([
  "txt",
  "md",
  "csv",
  "json",
  "xml",
  "yml",
  "yaml",
  "log",
  "html",
  "htm",
]);
const DOCX_FILE_EXTENSIONS = new Set(["docx"]);
const STOP_WORDS = new Set([
  "about",
  "after",
  "again",
  "also",
  "because",
  "been",
  "being",
  "between",
  "could",
  "does",
  "doing",
  "from",
  "have",
  "into",
  "just",
  "more",
  "most",
  "other",
  "over",
  "same",
  "should",
  "some",
  "such",
  "than",
  "that",
  "their",
  "them",
  "then",
  "there",
  "these",
  "this",
  "those",
  "through",
  "very",
  "what",
  "when",
  "where",
  "which",
  "while",
  "with",
  "would",
  "your",
]);

let pdfjsPromise: Promise<any> | null = null;
let mammothPromise: Promise<any> | null = null;

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function clipText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
}

function buildLocalSummary(input: SummaryRequest) {
  const normalizedText = normalizeText(input.extractedText ?? "");

  if (!normalizedText) {
    return null;
  }

  const shortText = clipText(normalizedText, 280);
  const sentences = normalizedText
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 24);

  if (sentences.length === 0) {
    return shortText;
  }

  if (sentences.length === 1) {
    return clipText(sentences[0], 280);
  }

  const frequency = new Map<string, number>();

  for (const word of normalizedText.toLowerCase().match(/[a-z]{4,}/g) ?? []) {
    if (STOP_WORDS.has(word)) {
      continue;
    }

    frequency.set(word, (frequency.get(word) ?? 0) + 1);
  }

  const rankedSentences = sentences.map((sentence, index) => {
    const words = sentence.toLowerCase().match(/[a-z]{4,}/g) ?? [];
    const score = words.reduce((total, word) => {
      if (STOP_WORDS.has(word)) {
        return total;
      }

      return total + (frequency.get(word) ?? 0);
    }, 0);

    return {
      sentence,
      index,
      score: score + (index === 0 ? 2 : 0),
    };
  });

  const selected = rankedSentences
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 2)
    .sort((a, b) => a.index - b.index)
    .map((item) => item.sentence);

  return clipText(selected.join(" "), 280);
}

function buildResolvedSummary(input: SummaryRequest) {
  return buildLocalSummary(input) ?? buildFallbackSummary(input);
}

async function getPdfJs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist/legacy/build/pdf.mjs").then((module) => {
      module.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
      return module;
    });
  }

  return pdfjsPromise;
}

async function getMammoth() {
  if (!mammothPromise) {
    mammothPromise = import("mammoth/mammoth.browser").then(
      (module) => module.default ?? module,
    );
  }

  return mammothPromise;
}

async function extractTextFromPlainFile(file: File) {
  const text = await file.text();
  const normalized = normalizeText(text);
  return normalized ? normalized.slice(0, MAX_SUMMARY_INPUT_LENGTH) : null;
}

async function extractTextFromDocx(file: File) {
  const mammoth = await getMammoth();
  const result = await mammoth.extractRawText({
    arrayBuffer: await file.arrayBuffer(),
  });
  const normalized = normalizeText(result.value ?? "");
  return normalized ? normalized.slice(0, MAX_SUMMARY_INPUT_LENGTH) : null;
}

async function extractTextFromPdf(file: File) {
  const pdfjs = await getPdfJs();
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
  });
  const document = await loadingTask.promise;
  const pages: string[] = [];

  try {
    const totalPages = Math.min(document.numPages, MAX_PDF_PAGES);

    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const pageText = normalizeText(
        Array.isArray(textContent.items)
          ? textContent.items
              .map((item: { str?: string }) => item.str ?? "")
              .join(" ")
          : "",
      );

      if (pageText) {
        pages.push(pageText);
      }

      page.cleanup?.();

      if (pages.join(" ").length >= MAX_SUMMARY_INPUT_LENGTH) {
        break;
      }
    }
  } finally {
    await document.destroy?.();
  }

  const combined = normalizeText(pages.join(" "));
  return combined ? combined.slice(0, MAX_SUMMARY_INPUT_LENGTH) : null;
}

export function isGenericSummary(summary: string | null | undefined) {
  const normalized = summary?.trim();
  return normalized != null && normalized.length > 0
    ? GENERIC_SUMMARY_PATTERN.test(normalized)
    : false;
}

export function buildFallbackSummary(input: SummaryRequest) {
  const description = input.description.trim();

  if (description) {
    const firstSentence = description.split(/(?<=[.!?])\s+/)[0]?.trim();
    if (firstSentence) {
      return firstSentence.length > 170
        ? `${firstSentence.slice(0, 167).trimEnd()}...`
        : firstSentence;
    }
  }

  return `BOT file ${input.name} from ${input.year} in ${input.category} was uploaded and stored for internal review.`;
}

export async function extractReadableText(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const isTextMime =
    file.type.startsWith("text/") ||
    file.type === "application/json" ||
    file.type === "application/xml";

  if (file.size > MAX_SUMMARIZABLE_FILE_SIZE) {
    return null;
  }

  try {
    if (extension === "pdf") {
      return await extractTextFromPdf(file);
    }

    if (DOCX_FILE_EXTENSIONS.has(extension)) {
      return await extractTextFromDocx(file);
    }

    if (isTextMime || TEXT_FILE_EXTENSIONS.has(extension)) {
      return await extractTextFromPlainFile(file);
    }

    return null;
  } catch {
    return null;
  }
}

export async function requestSummary(params: {
  supabase: AppSupabaseClient;
  input: SummaryRequest;
}) {
  const fallbackSummary = buildFallbackSummary(params.input);
  const localSummary = buildResolvedSummary(params.input);

  try {
    const {
      data: { session },
      error: sessionError,
    } = await params.supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      return {
        summary: localSummary,
        usedFallback: localSummary === fallbackSummary,
        error: "No active session available for summary request.",
      };
    }

    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

    if (!anonKey) {
      return {
        summary: localSummary,
        usedFallback: localSummary === fallbackSummary,
        error: "Supabase anon key is missing.",
      };
    }

    const { data, error } = await params.supabase.functions.invoke(
      "generate-summary",
      {
        body: {
          ...params.input,
          model: BOT_SUMMARY_MODEL,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: anonKey,
        },
      },
    );

    if (error) {
      return {
        summary: localSummary,
        usedFallback: localSummary === fallbackSummary,
        error: error.message,
      };
    }

    const summary = typeof data?.summary === "string" ? data.summary.trim() : "";

    return {
      summary: summary || localSummary,
      usedFallback: !summary && localSummary === fallbackSummary,
      error: summary ? null : "Edge function returned an empty summary.",
    };
  } catch (error) {
    return {
      summary: localSummary,
      usedFallback: localSummary === fallbackSummary,
      error: error instanceof Error ? error.message : "Summary generation failed.",
    };
  }
}
