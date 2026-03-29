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
    <Card className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/70">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-3xl font-semibold tracking-tight text-slate-950">
            {value}
          </p>
          <p className="mt-1 text-sm font-medium text-slate-700">{label}</p>
          <p className="mt-1 text-sm text-slate-500">{hint}</p>
        </div>
      </div>
    </Card>
  );
}

function InsightLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[1.1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
      {children}
    </div>
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
    <div className="rounded-[1.25rem] border border-slate-200">
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

  const years = React.useMemo(() => buildYearOptions(files), [files]);

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
    <div className="theme min-h-screen bg-[#f5f7fb] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <img
              src={collegeLogo}
              alt="Goa Community College logo"
              className="h-16 w-16 rounded-full border border-slate-200 bg-white object-cover shadow-sm"
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Goa Community College
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
                Simple File Storage
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-500">
                Signed-in users can upload, rename, download, and delete files in
                their own workspace. File content cannot be edited.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 md:items-end">
            <p className="text-sm text-slate-500">
              Signed in as <span className="font-medium text-slate-700">{user?.email}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => void handleSignOut()}
                disabled={isSigningOut}
              >
                <LogOut className="h-4 w-4" />
                {isSigningOut ? "Signing out..." : "Sign out"}
              </Button>
              <Button
                type="button"
                className="rounded-full bg-slate-700 text-white hover:bg-slate-600"
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
          <Card className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              Quick Analytics
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Lightweight home page insights.
            </p>

            <div className="mt-5 space-y-3">
              <InsightLine>
                {mostCommonYear
                  ? `Most files are from ${mostCommonYear} and can be filtered by year.`
                  : "Upload a file to start seeing year-based insights."}
              </InsightLine>
              <InsightLine>
                {summaryCount > 0
                  ? `${summaryCount} stored summaries are available for quick context.`
                  : "Summaries will be saved automatically when available during upload."}
              </InsightLine>
              <InsightLine>
                The system remains intentionally simple: upload, rename,
                download, and delete.
              </InsightLine>
            </div>
          </Card>
        </section>

        <section>
          <Card className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70">
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                  Files
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Simple list of stored files with year filter.
                </p>
              </div>

              <div className="rounded-[1.1rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Session active for {user?.email ?? "your account"}.
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

                <div className="flex items-center gap-3 self-end">
                  <span className="text-sm text-slate-500">Year</span>
                  <Select value={yearFilter} onValueChange={setYearFilter}>
                    <SelectTrigger className="h-11 w-[130px] rounded-2xl border-slate-200 bg-white">
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
                <div className="overflow-hidden rounded-[1.25rem] border border-slate-200">
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
        <DialogContent className="max-w-lg rounded-[1.5rem] border border-slate-200 bg-white">
          <DialogHeader>
            <DialogTitle>{previewFile?.name ?? "File details"}</DialogTitle>
            <DialogDescription>
              File information and saved summary.
            </DialogDescription>
          </DialogHeader>

          {previewFile ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
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
                    <div className="flex h-[16rem] items-center justify-center text-sm text-slate-500">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading preview...
                    </div>
                  ) : previewError ? (
                    <div className="flex h-[16rem] items-center justify-center px-6 text-center text-sm text-rose-600">
                      {previewError}
                    </div>
                  ) : previewKind === "image" && previewUrl ? (
                    <div className="flex min-h-[12rem] items-center justify-center bg-slate-50 p-4">
                      <img
                        src={previewUrl}
                        alt={previewFile.name}
                        className="max-h-[16rem] w-auto max-w-full rounded-xl object-contain"
                      />
                    </div>
                  ) : previewKind === "pdf" && previewUrl ? (
                    <iframe
                      title={`${previewFile.name} preview`}
                      src={previewUrl}
                      className="h-[18rem] w-full bg-white"
                    />
                  ) : (
                    <div className="flex h-[12rem] items-center justify-center px-6 text-center text-sm text-slate-500">
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
        <DialogContent className="max-w-md rounded-[1.5rem] border border-slate-200 bg-white">
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
        <DialogContent className="max-w-md rounded-[1.5rem] border border-slate-200 bg-white">
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
