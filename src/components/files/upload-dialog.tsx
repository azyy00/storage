import * as React from "react";
import { Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BOT_STORAGE_BUCKET,
  BOT_DEFAULT_CATEGORY,
} from "@/lib/constants";
import { detectFileType, formatFileSize } from "@/lib/file-utils";
import { supabase } from "@/lib/supabaseClient";
import { extractReadableText, requestSummary } from "@/lib/summary";
import { uploadFileToStorage } from "@/lib/storage";
import type { BotFileRecord } from "@/types/database";

type UploadDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  uploader: string;
  years: string[];
  onUploaded: (files: BotFileRecord[]) => Promise<void> | void;
};

const currentYear = String(new Date().getFullYear());

export function UploadDialog({
  open,
  onOpenChange,
  userId,
  uploader,
  years,
  onUploaded,
}: UploadDialogProps) {
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [name, setName] = React.useState("");
  const [year, setYear] = React.useState<string>(currentYear);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const totalSelectedSize = React.useMemo(
    () => selectedFiles.reduce((sum, file) => sum + file.size, 0),
    [selectedFiles],
  );
  const isBatchUpload = selectedFiles.length > 1;

  React.useEffect(() => {
    if (!open) {
      return;
    }

    setError(null);
    if (!year) {
      setYear(currentYear);
    }
  }, [open, year]);

  function resetForm() {
    setSelectedFiles([]);
    setName("");
    setYear(currentYear);
    setError(null);
    setIsSubmitting(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }

    if (selectedFiles.length === 0) {
      setError("At least one file is required.");
      return;
    }

    const trimmedName = name.trim();
    if (!isBatchUpload && !trimmedName) {
      setError("File name cannot be blank.");
      return;
    }

    if (!year.trim()) {
      setError("Year is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const uploadedRecords: BotFileRecord[] = [];
      const failedFiles: string[] = [];
      let fallbackCount = 0;

      for (const selectedFile of selectedFiles) {
        const targetName = isBatchUpload ? selectedFile.name : trimmedName;
        let uploadedPath: string | null = null;

        try {
          const renamedFile =
            targetName === selectedFile.name
              ? selectedFile
              : new File([selectedFile], targetName, {
                  type: selectedFile.type,
                  lastModified: selectedFile.lastModified,
                });

          uploadedPath = await uploadFileToStorage({
            supabase,
            userId,
            file: renamedFile,
            year,
            category: BOT_DEFAULT_CATEGORY,
            fileName: targetName,
          });

          const extractedText = await extractReadableText(renamedFile);
          const summaryResult = await requestSummary({
            supabase,
            input: {
              name: targetName,
              year,
              category: BOT_DEFAULT_CATEGORY,
              description: "",
              extractedText,
            },
          });

          const { data, error: insertError } = await supabase
            .from("bot_files")
            .insert({
              user_id: userId,
              name: targetName,
              file_path: uploadedPath,
              file_url: null,
              year,
              category: BOT_DEFAULT_CATEGORY,
              file_type: detectFileType(targetName),
              file_size: renamedFile.size,
              description: null,
              summary: summaryResult.summary,
              uploader,
            })
            .select("*")
            .single();

          if (insertError) {
            throw insertError;
          }

          if (summaryResult.usedFallback) {
            fallbackCount += 1;
          }

          uploadedRecords.push(data as BotFileRecord);
        } catch (fileError) {
          if (supabase && uploadedPath) {
            await supabase.storage.from(BOT_STORAGE_BUCKET).remove([uploadedPath]);
          }

          failedFiles.push(
            fileError instanceof Error
              ? `${selectedFile.name}: ${fileError.message}`
              : selectedFile.name,
          );
        }
      }

      if (uploadedRecords.length === 0) {
        throw new Error(failedFiles[0] ?? "Upload failed.");
      }

      await onUploaded(uploadedRecords);

      if (uploadedRecords.length === 1 && failedFiles.length === 0) {
        if (fallbackCount > 0) {
          toast.warning("File uploaded. A basic summary was saved.");
        } else {
          toast.success("File uploaded.");
        }
      } else if (failedFiles.length > 0) {
        toast.warning(
          `${uploadedRecords.length} file${uploadedRecords.length === 1 ? "" : "s"} uploaded. ${failedFiles.length} failed.`,
        );
      } else if (fallbackCount > 0) {
        toast.warning(
          `${uploadedRecords.length} files uploaded. ${fallbackCount} used a basic summary.`,
        );
      } else {
        toast.success(
          `${uploadedRecords.length} file${uploadedRecords.length === 1 ? "" : "s"} uploaded.`,
        );
      }

      onOpenChange(false);
      resetForm();
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Upload failed.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isSubmitting) {
          onOpenChange(nextOpen);
        }

        if (!nextOpen) {
          resetForm();
        }
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-[calc(100%-1.25rem)] overflow-y-auto rounded-[1.5rem] border border-slate-200 bg-white p-0 sm:max-w-xl sm:rounded-[1.75rem]">
        <DialogHeader className="border-b border-slate-200 px-4 py-4 sm:px-6 sm:py-5">
          <DialogTitle className="text-xl font-semibold text-slate-950">
            Upload files
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Add one or more files, assign their year, and store them securely.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5 px-4 py-5 sm:px-6 sm:py-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="upload-file">File</Label>
            <label
              htmlFor="upload-file"
              className="flex cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center transition-all hover:border-slate-400 hover:bg-white"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white text-slate-700 shadow-sm">
                <UploadCloud className="h-6 w-6" />
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-900">
                {selectedFiles.length === 0
                  ? "Choose files from your device"
                  : selectedFiles.length === 1
                    ? selectedFiles[0].name
                    : `${selectedFiles.length} files selected`}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {selectedFiles.length === 1
                  ? `${formatFileSize(selectedFiles[0].size)} - ${detectFileType(selectedFiles[0].name)}`
                  : selectedFiles.length > 1
                    ? `${formatFileSize(totalSelectedSize)} total selected`
                  : "PDF, DOCX, XLSX, CSV, TXT, and similar files"}
              </p>
            </label>
            {selectedFiles.length > 1 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <p className="font-medium text-slate-900">
                  {selectedFiles.length} files ready to upload
                </p>
                <p className="mt-1">
                  Original file names will be used for batch upload.
                </p>
              </div>
            ) : null}
            <input
              id="upload-file"
              type="file"
              multiple
              className="hidden"
              onChange={(event) => {
                const nextFiles = Array.from(event.target.files ?? []);
                setSelectedFiles(nextFiles);
                setName(nextFiles.length === 1 ? nextFiles[0].name : "");
              }}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
            {isBatchUpload ? (
              <div className="space-y-2">
                <Label>File names</Label>
                <div className="flex h-11 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-500">
                  Using original names for all selected files
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="upload-name">File name</Label>
                <Input
                  id="upload-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="company-profile.pdf"
                  className="h-11 rounded-2xl"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Year</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="h-11 w-full rounded-2xl">
                  <SelectValue placeholder="Choose a year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl"
              disabled={isSubmitting}
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-2xl bg-slate-900 text-white hover:bg-slate-800"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isSubmitting
                ? "Uploading..."
                : `Upload ${selectedFiles.length > 1 ? "files" : "file"}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
