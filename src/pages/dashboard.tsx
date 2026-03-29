import * as React from "react";
import {
  CalendarDays,
  Download,
  FileText,
  HardDrive,
  Loader2,
  LogOut,
  PencilLine,
  Search,
  TrendingUp,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import collegeLogo from "../../Logo.png";
import { UploadDialog } from "@/components/files/upload-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBotFiles } from "@/hooks/useBotFiles";
import {
  buildYearOptions,
  formatDateStamp,
  formatFileSize,
} from "@/lib/file-utils";
import { extractReadableText, isGenericSummary, requestSummary } from "@/lib/summary";
import {
  createSignedDownloadUrl,
  createSignedPreviewUrl,
  downloadStoredFile,
} from "@/lib/storage";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/providers/auth-provider";
import type { BotFileRecord } from "@/types/database";

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70 sm:rounded-[1.6rem] sm:p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 sm:h-11 sm:w-11">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            {value}
          </p>
          <p className="mt-1 text-sm font-medium text-slate-700">{label}</p>
          <p className="mt-1 text-sm text-slate-500">{hint}</p>
        </div>
      </div>
    </Card>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-white text-slate-500 shadow-sm">
        <FileText className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function LoadingTable() {
  return (
    <>
      <div className="space-y-3 md:hidden">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-[1.25rem] border border-slate-200 bg-white p-4"
          >
            <div className="h-5 w-3/4 animate-pulse rounded-full bg-slate-100" />
            <div className="mt-4 grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((__, cellIndex) => (
                <div
                  key={cellIndex}
                  className="h-14 animate-pulse rounded-2xl bg-slate-100"
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="hidden rounded-[1.25rem] border border-slate-200 md:block">
        <div className="grid grid-cols-6 gap-4 px-4 py-3 text-sm font-medium text-slate-500">
          <div>Name</div>
          <div>Type</div>
          <div>Year</div>
          <div>Size</div>
          <div>Updated</div>
          <div className="text-right">Actions</div>
        </div>
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="grid grid-cols-6 gap-4 border-t border-slate-200 px-4 py-4"
          >
            {Array.from({ length: 6 }).map((__, cellIndex) => (
              <div
                key={cellIndex}
                className="h-5 animate-pulse rounded-full bg-slate-100"
              />
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

function MobileFileCard({
  file,
  isDownloading,
  onOpen,
  onRename,
  onDownload,
  onDelete,
}: {
  file: BotFileRecord;
  isDownloading: boolean;
  onOpen: () => void;
  onRename: () => void;
  onDownload: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="rounded-[1.35rem] border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50/70"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {file.name}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Updated {formatDateStamp(file.updated_at)}
            </p>
          </div>
        </div>

        <Badge
          variant="outline"
          className="rounded-full border-slate-200 bg-white px-2.5 py-0.5 text-slate-600"
        >
          {file.file_type ?? "FILE"}
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Year
          </p>
          <p className="mt-1 text-sm font-medium text-slate-900">{file.year}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Size
          </p>
          <p className="mt-1 text-sm font-medium text-slate-900">
            {formatFileSize(file.file_size)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={(event) => {
            event.stopPropagation();
            onRename();
          }}
        >
          <PencilLine className="h-4 w-4" />
          Rename
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={(event) => {
            event.stopPropagation();
            onDownload();
          }}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Download
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>
    </div>
  );
}

function getMostCommonYear(files: BotFileRecord[]) {
  if (files.length === 0) {
    return null;
  }

  const counts = files.reduce<Record<string, number>>((result, file) => {
    result[file.year] = (result[file.year] ?? 0) + 1;
    return result;
  }, {});

  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

function buildTrendSeries(files: BotFileRecord[]) {
  const byYear = files.reduce<
    Record<string, { year: string; count: number; size: number; summaries: number }>
  >((result, file) => {
    const year = file.year;
    const bucket = result[year] ?? {
      year,
      count: 0,
      size: 0,
      summaries: 0,
    };

    bucket.count += 1;
    bucket.size += file.file_size ?? 0;
    bucket.summaries += file.summary?.trim() ? 1 : 0;
    result[year] = bucket;

    return result;
  }, {});

  const entries = Object.values(byYear).sort((a, b) => Number(a.year) - Number(b.year));

  if (entries.length > 0) {
    return entries;
  }

  const currentYear = new Date().getFullYear();
  return Array.from({ length: 4 }).map((_, index) => ({
    year: String(currentYear - (3 - index)),
    count: 0,
    size: 0,
    summaries: 0,
  }));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function seededNoise(seed: number) {
  const raw = Math.sin(seed * 12.9898) * 43758.5453;
  return raw - Math.floor(raw);
}

function StorageTrendPanel({
  series,
  totalFiles,
  totalBytes,
  summaryCount,
  latestUpdate,
  dominantYear,
}: {
  series: Array<{ year: string; count: number; size: number; summaries: number }>;
  totalFiles: number;
  totalBytes: number;
  summaryCount: number;
  latestUpdate: string;
  dominantYear: string | null;
}) {
  const chartWidth = 640;
  const chartHeight = 180;
  const paddingX = 18;
  const paddingTop = 18;
  const paddingBottom = 28;
  const usableWidth = chartWidth - paddingX * 2;
  const usableHeight = chartHeight - paddingTop - paddingBottom;
  const maxValue = Math.max(...series.map((item) => item.count), 1);
  const minValue = Math.min(...series.map((item) => item.count), 0);
  const valueRange = Math.max(maxValue - minValue, 1);
  const points = series.map((item, index) => {
    const ratio = series.length === 1 ? 0.5 : index / (series.length - 1);
    const x = paddingX + ratio * usableWidth;
    const y =
      paddingTop + usableHeight - ((item.count - minValue) / valueRange) * usableHeight;

    return {
      ...item,
      x,
      y,
    };
  });

  const sparklinePoints =
    points.length > 1
      ? points.flatMap((point, index) => {
          const nextPoint = points[index + 1];

          if (!nextPoint) {
            return [point];
          }

          const stepCount = 12;

          return Array.from({ length: stepCount }, (_, stepIndex) => {
            const progress = stepIndex / stepCount;
            const x = point.x + (nextPoint.x - point.x) * progress;
            const baseY = point.y + (nextPoint.y - point.y) * progress;
            const sway =
              (seededNoise(index * 100 + stepIndex + point.count + nextPoint.count) - 0.5) *
              34;
            const spike =
              stepIndex % 5 === 2
                ? (seededNoise(index * 13 + stepIndex) > 0.5 ? -22 : 16)
                : 0;
            const y = clamp(
              baseY - (sway + spike) * Math.sin(Math.PI * progress),
              paddingTop + 6,
              chartHeight - paddingBottom - 6,
            );

            return {
              x,
              y,
            };
          });
        })
      : points.map((point, index) => ({
          x:
            paddingX +
            (usableWidth / 7) * index,
          y: clamp(
            point.y -
              (seededNoise(index + point.count) - 0.5) * 30,
            paddingTop + 8,
            chartHeight - paddingBottom - 8,
          ),
        }));
  const sparklinePath = sparklinePoints
    .map((point) => `${point.x},${point.y}`)
    .join(" ");
  const firstValue = series[0]?.count ?? 0;
  const lastValue = series[series.length - 1]?.count ?? 0;
  const trendDelta =
    firstValue === 0 ? (lastValue > 0 ? 100 : 0) : ((lastValue - firstValue) / firstValue) * 100;
  const trendLabel = `${trendDelta >= 0 ? "+" : ""}${Math.round(trendDelta)}%`;
  const trendTone =
    trendDelta >= 0 ? "text-emerald-600" : "text-rose-600";

  return (
    <Card className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70 sm:rounded-[1.8rem] sm:p-6">
      <div className="flex flex-col gap-6 xl:flex-row">
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                <TrendingUp className="h-3.5 w-3.5" />
                Storage Trend
              </div>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                Archive activity view
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                A chart-style view of how many files are stored each year.
              </p>
            </div>

            <div className="rounded-[1.3rem] border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                Trend change
              </p>
              <p className="mt-1 text-2xl font-semibold text-emerald-950">
                {trendLabel}
              </p>
              <p className="mt-1 text-xs text-emerald-800/80">
                Compared with the earliest year shown
              </p>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white p-4 text-slate-950 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.25)] sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  File count curve
                </p>
                <div className="mt-2 flex items-end gap-3">
                  <p className="text-3xl font-semibold tracking-tight text-slate-950">
                    {totalFiles}
                  </p>
                  <p className={`pb-1 text-sm font-medium ${trendTone}`}>
                    {trendLabel}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm sm:min-w-[220px]">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
                    Strongest year
                  </p>
                  <p className="mt-1 font-medium text-slate-950">
                    {dominantYear ?? "--"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
                    Latest update
                  </p>
                  <p className="mt-1 font-medium text-slate-950">{latestUpdate}</p>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="h-[180px] w-full"
                preserveAspectRatio="none"
                aria-label="Storage trend chart"
              >
                {sparklinePath ? (
                  <polyline
                    points={sparklinePath}
                    fill="none"
                    stroke="#15803d"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : null}

                {[points[0], points[points.length - 1]]
                  .filter((point, index, array): point is (typeof points)[number] => Boolean(point) && array.findIndex((candidate) => candidate?.year === point?.year) === index)
                  .map((point) => (
                  <g key={point.year}>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="3.5"
                      fill="#ffffff"
                      stroke="#15803d"
                      strokeWidth="2"
                    />
                    <text
                      x={point.x}
                      y={chartHeight - 10}
                      textAnchor="middle"
                      fill="#64748b"
                      fontSize="12"
                      fontWeight="600"
                    >
                      {point.year}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1 xl:min-w-[230px]">
          <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Total storage
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              {formatFileSize(totalBytes)}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Combined uploaded file size
            </p>
          </div>
          <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Saved summaries
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              {summaryCount}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Files with ready-to-read summaries
            </p>
          </div>
          <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Years tracked
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              {new Set(series.map((item) => item.year)).size}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Archive range currently visible
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

function getPreviewKind(file: BotFileRecord | null) {
  if (!file) {
    return null;
  }

  const extension = file.name.split(".").pop()?.trim().toLowerCase() ?? "";

  if (extension === "pdf") {
    return "pdf";
  }

  if (
    ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg", "avif"].includes(
      extension,
    )
  ) {
    return "image";
  }

  return null;
}

export function DashboardPage() {
  const { user, signOut } = useAuth();
  const {
    files,
    isLoading,
    error,
    refresh,
    renameFile,
    deleteFile,
    updateFileSummary,
  } = useBotFiles(user?.id);

  const [searchQuery, setSearchQuery] = React.useState("");
  const [yearFilter, setYearFilter] = React.useState("all");
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);
  const [isSigningOut, setIsSigningOut] = React.useState(false);
  const [isRenaming, setIsRenaming] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [downloadingFileId, setDownloadingFileId] = React.useState<string | null>(
    null,
  );
  const [previewFile, setPreviewFile] = React.useState<BotFileRecord | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [previewError, setPreviewError] = React.useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = React.useState(false);
  const [isSummaryLoading, setIsSummaryLoading] = React.useState(false);
  const [summaryNotice, setSummaryNotice] = React.useState<string | null>(null);
  const [renameTarget, setRenameTarget] = React.useState<BotFileRecord | null>(null);
  const [renameName, setRenameName] = React.useState("");
  const [deleteTarget, setDeleteTarget] = React.useState<BotFileRecord | null>(null);
  const summaryAttemptedIds = React.useRef(new Set<string>());

  React.useEffect(() => {
    document.title = "Goa Community College File Storage Portal";
  }, []);

  const years = React.useMemo(() => buildYearOptions(files), [files]);
  const trendSeries = React.useMemo(() => buildTrendSeries(files), [files]);

  const sortedFiles = React.useMemo(
    () =>
      [...files].sort(
        (a, b) =>
          new Date(b.updated_at ?? b.created_at).getTime() -
          new Date(a.updated_at ?? a.created_at).getTime(),
      ),
    [files],
  );

  const filteredFiles = React.useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return sortedFiles.filter((file) => {
      const matchesYear = yearFilter === "all" || file.year === yearFilter;
      const haystack = [file.name, file.year, file.file_type ?? "", file.uploader ?? ""]
        .join(" ")
        .toLowerCase();
      const matchesQuery =
        normalizedQuery.length === 0 || haystack.includes(normalizedQuery);

      return matchesYear && matchesQuery;
    });
  }, [searchQuery, sortedFiles, yearFilter]);

  const totalBytes = React.useMemo(
    () => files.reduce((sum, file) => sum + (file.file_size ?? 0), 0),
    [files],
  );

  const latestFile = sortedFiles[0] ?? null;
  const mostCommonYear = getMostCommonYear(files);
  const summaryCount = files.filter((file) => Boolean(file.summary?.trim())).length;
  const previewKind = React.useMemo(() => getPreviewKind(previewFile), [previewFile]);

  React.useEffect(() => {
    if (!previewFile || !previewKind || !supabase) {
      setPreviewUrl(null);
      setPreviewError(null);
      setIsPreviewLoading(false);
      return;
    }

    let isActive = true;

    setIsPreviewLoading(true);
    setPreviewUrl(null);
    setPreviewError(null);

    void createSignedPreviewUrl({
      supabase,
      filePath: previewFile.file_path,
    })
      .then((signedUrl) => {
        if (!isActive) {
          return;
        }

        setPreviewUrl(signedUrl);
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }

        setPreviewError(
          error instanceof Error ? error.message : "Unable to load preview.",
        );
      })
      .finally(() => {
        if (!isActive) {
          return;
        }

        setIsPreviewLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [previewFile, previewKind]);

  React.useEffect(() => {
    setSummaryNotice(null);
    setIsSummaryLoading(false);
  }, [previewFile?.id]);

  React.useEffect(() => {
    if (!previewFile || !supabase) {
      return;
    }

    const currentSummary = previewFile.summary?.trim() ?? "";
    const needsSummary = !currentSummary || isGenericSummary(currentSummary);

    if (!needsSummary || summaryAttemptedIds.current.has(previewFile.id)) {
      return;
    }

    let isActive = true;
    const currentFile = previewFile;

    setIsSummaryLoading(true);
    setSummaryNotice(null);

    void (async () => {
      try {
        const storedBlob = await downloadStoredFile({
          supabase,
          filePath: currentFile.file_path,
        });
        const fileForSummary = new File([storedBlob], currentFile.name, {
          type: storedBlob.type,
        });
        const extractedText = await extractReadableText(fileForSummary);
        const summaryResult = await requestSummary({
          supabase,
          input: {
            name: currentFile.name,
            year: currentFile.year,
            category: currentFile.category,
            description: currentFile.description ?? "",
            extractedText,
          },
        });

        summaryAttemptedIds.current.add(currentFile.id);

        let nextFile = currentFile;
        const nextSummary = summaryResult.summary.trim();

        if (nextSummary && nextSummary !== currentSummary) {
          nextFile = await updateFileSummary(currentFile, nextSummary);
        }

        if (!isActive) {
          return;
        }

        setPreviewFile(nextFile);

        if (!extractedText && summaryResult.usedFallback) {
          setSummaryNotice(
            "This file type could only keep a basic saved summary right now.",
          );
        } else if (summaryResult.error && !summaryResult.usedFallback) {
          setSummaryNotice(
            "A file-based summary was saved while the AI summary service was unavailable.",
          );
        } else if (summaryResult.error) {
          setSummaryNotice(
            "This file still uses a basic summary because its text could not be read.",
          );
        }
      } catch (summaryError) {
        summaryAttemptedIds.current.add(currentFile.id);

        if (!isActive) {
          return;
        }

        setSummaryNotice(
          summaryError instanceof Error
            ? summaryError.message
            : "Unable to generate a summary for this file.",
        );
      } finally {
        if (isActive) {
          setIsSummaryLoading(false);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [previewFile, updateFileSummary]);

  async function handleUploadComplete(_file: BotFileRecord) {
    await refresh();
  }

  async function handleDownload(file: BotFileRecord) {
    if (!supabase) {
      toast.error("Supabase is not configured.");
      return;
    }

    setDownloadingFileId(file.id);

    try {
      const signedUrl = await createSignedDownloadUrl({
        supabase,
        filePath: file.file_path,
        downloadName: file.name,
      });

      const anchor = document.createElement("a");
      anchor.href = signedUrl;
      anchor.download = file.name;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch (downloadError) {
      toast.error(
        downloadError instanceof Error
          ? downloadError.message
          : "Unable to prepare the download.",
      );
    } finally {
      setDownloadingFileId(null);
    }
  }

  async function handleRenameSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!renameTarget) {
      return;
    }

    setIsRenaming(true);

    try {
      const nextFile = await renameFile(renameTarget, renameName);
      if (previewFile?.id === nextFile.id) {
        setPreviewFile(nextFile);
      }
      toast.success("File renamed.");
      setRenameTarget(null);
      setRenameName("");
    } catch (renameError) {
      toast.error(
        renameError instanceof Error ? renameError.message : "Unable to rename file.",
      );
    } finally {
      setIsRenaming(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteFile(deleteTarget);
      if (previewFile?.id === deleteTarget.id) {
        setPreviewFile(null);
      }
      toast.success("File deleted.");
      setDeleteTarget(null);
    } catch (deleteError) {
      toast.error(
        deleteError instanceof Error ? deleteError.message : "Unable to delete file.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      await signOut();
      toast.success("Signed out.");
    } catch (signOutError) {
      toast.error(
        signOutError instanceof Error
          ? signOutError.message
          : "Unable to sign out.",
      );
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div className="theme min-h-screen bg-[#f5f7fb] px-3 py-4 text-slate-900 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-5 sm:space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3 sm:gap-4">
            <img
              src={collegeLogo}
              alt="Goa Community College logo"
              className="h-14 w-14 rounded-full border border-slate-200 bg-white object-cover shadow-sm sm:h-16 sm:w-16"
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Goa Community College
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                Simple File Storage
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Signed-in users can upload, rename, download, and delete files in
                their own workspace. File content cannot be edited.
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:w-auto lg:flex-col lg:items-end">
            <p className="text-sm text-slate-500 break-all sm:text-right">
              Signed in as <span className="font-medium text-slate-700">{user?.email}</span>
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-full sm:w-auto"
                onClick={() => void handleSignOut()}
                disabled={isSigningOut}
              >
                <LogOut className="h-4 w-4" />
                {isSigningOut ? "Signing out..." : "Sign out"}
              </Button>
              <Button
                type="button"
                className="w-full rounded-full bg-slate-700 text-white hover:bg-slate-600 sm:w-auto"
                onClick={() => setIsUploadOpen(true)}
              >
                <Upload className="h-4 w-4" />
                Upload File
              </Button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Total Files"
            value={String(files.length)}
            hint="Stored file records"
            icon={FileText}
          />
          <MetricCard
            label="Years"
            value={String(new Set(files.map((file) => file.year)).size)}
            hint="Available year groups"
            icon={CalendarDays}
          />
          <MetricCard
            label="Latest Update"
            value={latestFile ? formatDateStamp(latestFile.updated_at) : "--"}
            hint="Most recent file change"
            icon={CalendarDays}
          />
          <MetricCard
            label="Stored Size"
            value={formatFileSize(totalBytes)}
            hint="Total uploaded file size"
            icon={HardDrive}
          />
        </section>

        <section>
          <StorageTrendPanel
            series={trendSeries}
            totalFiles={files.length}
            totalBytes={totalBytes}
            summaryCount={summaryCount}
            latestUpdate={latestFile ? formatDateStamp(latestFile.updated_at) : "--"}
            dominantYear={mostCommonYear}
          />
        </section>

        <section>
          <Card className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70 sm:rounded-[1.8rem] sm:p-6">
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                  Files
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Simple list of stored files with year filter.
                </p>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="relative w-full md:max-w-sm">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="h-11 rounded-2xl border-slate-200 bg-white pl-10"
                    placeholder="Search files..."
                  />
                </div>

                <div className="flex w-full items-center gap-3 md:w-auto md:self-end">
                  <span className="text-sm text-slate-500">Year</span>
                  <Select value={yearFilter} onValueChange={setYearFilter}>
                    <SelectTrigger className="h-11 w-full rounded-2xl border-slate-200 bg-white md:w-[130px]">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {years.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isLoading ? (
                <LoadingTable />
              ) : error ? (
                <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
                  {error}
                </div>
              ) : files.length === 0 ? (
                <EmptyState
                  title="No files yet"
                  description="Use the upload button to add your first file to storage."
                />
              ) : filteredFiles.length === 0 ? (
                <EmptyState
                  title="No matching files"
                  description="Try a different search term or switch the year filter back to All."
                />
              ) : (
                <>
                  <div className="space-y-3 md:hidden">
                    {filteredFiles.map((file) => (
                      <MobileFileCard
                        key={file.id}
                        file={file}
                        isDownloading={downloadingFileId === file.id}
                        onOpen={() => setPreviewFile(file)}
                        onRename={() => {
                          setRenameTarget(file);
                          setRenameName(file.name);
                        }}
                        onDownload={() => {
                          void handleDownload(file);
                        }}
                        onDelete={() => setDeleteTarget(file)}
                      />
                    ))}
                  </div>

                  <div className="hidden overflow-hidden rounded-[1.25rem] border border-slate-200 md:block">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow className="hover:bg-slate-50">
                          <TableHead className="px-4 py-3">Name</TableHead>
                          <TableHead className="px-4 py-3">Type</TableHead>
                          <TableHead className="px-4 py-3">Year</TableHead>
                          <TableHead className="px-4 py-3">Size</TableHead>
                          <TableHead className="px-4 py-3">Updated</TableHead>
                          <TableHead className="px-4 py-3 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredFiles.map((file) => (
                          <TableRow
                            key={file.id}
                            className="cursor-pointer hover:bg-slate-50/80"
                            role="button"
                            tabIndex={0}
                            onClick={() => setPreviewFile(file)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                setPreviewFile(file);
                              }
                            }}
                          >
                            <TableCell className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                                  <FileText className="h-4 w-4" />
                                </div>
                                <span className="font-medium text-slate-900">
                                  {file.name}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-4">
                              <Badge
                                variant="outline"
                                className="rounded-full border-slate-200 bg-white px-2.5 py-0.5 text-slate-600"
                              >
                                {file.file_type ?? "FILE"}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-4 py-4">
                              <Badge
                                variant="outline"
                                className="rounded-full border-slate-200 bg-slate-50 px-2.5 py-0.5 text-slate-600"
                              >
                                {file.year}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-4 py-4 text-slate-600">
                              {formatFileSize(file.file_size)}
                            </TableCell>
                            <TableCell className="px-4 py-4 text-slate-600">
                              {formatDateStamp(file.updated_at)}
                            </TableCell>
                            <TableCell className="px-4 py-4">
                              <div className="flex justify-end gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  className="rounded-full"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setRenameTarget(file);
                                    setRenameName(file.name);
                                  }}
                                >
                                  <PencilLine className="h-4 w-4" />
                                  <span className="sr-only">Rename file</span>
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  className="rounded-full"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    void handleDownload(file);
                                  }}
                                  disabled={downloadingFileId === file.id}
                                >
                                  {downloadingFileId === file.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Download className="h-4 w-4" />
                                  )}
                                  <span className="sr-only">Download file</span>
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  className="rounded-full text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setDeleteTarget(file);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete file</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </div>
          </Card>
        </section>
      </div>

      {user ? (
        <UploadDialog
          open={isUploadOpen}
          onOpenChange={setIsUploadOpen}
          userId={user.id}
          uploader={user.email ?? "Admin"}
          onUploaded={handleUploadComplete}
        />
      ) : null}

      <Dialog
        open={Boolean(previewFile)}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewFile(null);
            setPreviewUrl(null);
            setPreviewError(null);
            setSummaryNotice(null);
            setIsSummaryLoading(false);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-[calc(100%-1.25rem)] overflow-y-auto rounded-[1.35rem] border border-slate-200 bg-white p-4 sm:max-w-lg sm:rounded-[1.5rem] sm:p-6">
          <DialogHeader>
            <DialogTitle>{previewFile?.name ?? "File details"}</DialogTitle>
            <DialogDescription>
              File information and saved summary.
            </DialogDescription>
          </DialogHeader>

          {previewFile ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Preview
                  </p>
                  {previewUrl ? (
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-slate-700 underline underline-offset-4"
                    >
                      Open in new tab
                    </a>
                  ) : null}
                </div>

                <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  {isPreviewLoading ? (
                    <div className="flex h-[13rem] items-center justify-center text-sm text-slate-500 sm:h-[16rem]">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading preview...
                    </div>
                  ) : previewError ? (
                    <div className="flex h-[13rem] items-center justify-center px-6 text-center text-sm text-rose-600 sm:h-[16rem]">
                      {previewError}
                    </div>
                  ) : previewKind === "image" && previewUrl ? (
                    <div className="flex min-h-[10rem] items-center justify-center bg-slate-50 p-4 sm:min-h-[12rem]">
                      <img
                        src={previewUrl}
                        alt={previewFile.name}
                        className="max-h-[13rem] w-auto max-w-full rounded-xl object-contain sm:max-h-[16rem]"
                      />
                    </div>
                  ) : previewKind === "pdf" && previewUrl ? (
                    <iframe
                      title={`${previewFile.name} preview`}
                      src={previewUrl}
                      className="h-[14rem] w-full bg-white sm:h-[18rem]"
                    />
                  ) : (
                    <div className="flex h-[10rem] items-center justify-center px-6 text-center text-sm text-slate-500 sm:h-[12rem]">
                      Preview is available for PDF and image files only.
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Type
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-900">
                    {previewFile.file_type ?? "FILE"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Year
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-900">
                    {previewFile.year}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Size
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-900">
                    {formatFileSize(previewFile.file_size)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Updated
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-900">
                    {formatDateStamp(previewFile.updated_at)}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Summary
                  </p>
                  {isSummaryLoading ? (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Generating
                    </div>
                  ) : null}
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  {previewFile.summary?.trim() ||
                    (isSummaryLoading
                      ? "Generating a summary from the file content..."
                      : "No summary is available for this file yet.")}
                </p>
                {summaryNotice ? (
                  <p className="mt-3 text-xs leading-5 text-slate-500">
                    {summaryNotice}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(renameTarget)}
        onOpenChange={(open) => {
          if (!open && !isRenaming) {
            setRenameTarget(null);
            setRenameName("");
          }
        }}
      >
        <DialogContent className="max-w-[calc(100%-1.25rem)] rounded-[1.35rem] border border-slate-200 bg-white p-4 sm:max-w-md sm:rounded-[1.5rem] sm:p-6">
          <DialogHeader>
            <DialogTitle>Rename file</DialogTitle>
            <DialogDescription>
              Update the file name shown in the storage table.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleRenameSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="rename-file">
                File name
              </label>
              <Input
                id="rename-file"
                value={renameName}
                onChange={(event) => setRenameName(event.target.value)}
                className="h-11 rounded-2xl"
                placeholder="company-profile.pdf"
                disabled={isRenaming}
              />
            </div>

            <DialogFooter className="border-t border-slate-200 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setRenameTarget(null);
                  setRenameName("");
                }}
                disabled={isRenaming}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-slate-900 text-white hover:bg-slate-800"
                disabled={isRenaming}
              >
                {isRenaming ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isRenaming ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeleteTarget(null);
          }
        }}
      >
        <DialogContent className="max-w-[calc(100%-1.25rem)] rounded-[1.35rem] border border-slate-200 bg-white p-4 sm:max-w-md sm:rounded-[1.5rem] sm:p-6">
          <DialogHeader>
            <DialogTitle>Delete file</DialogTitle>
            <DialogDescription>
              This will remove the file record and its stored file.
            </DialogDescription>
          </DialogHeader>

          <p className="text-sm text-slate-600">
            Are you sure you want to delete{" "}
            <span className="font-medium text-slate-900">
              {deleteTarget?.name ?? "this file"}
            </span>
            ?
          </p>

          <DialogFooter className="border-t border-slate-200 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handleDeleteConfirm()}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
