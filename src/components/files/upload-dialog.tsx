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
  BOT_DEFAULT_YEARS,
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
  onUploaded: (file: BotFileRecord) => Promise<void> | void;
};

const currentYear = String(new Date().getFullYear());

export function UploadDialog({
  open,
  onOpenChange,
  userId,
  uploader,
  onUploaded,
}: UploadDialogProps) {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [name, setName] = React.useState("");
  const [year, setYear] = React.useState<string>(currentYear);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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
    setSelectedFile(null);
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

    if (!selectedFile) {
      setError("A file is required.");
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("File name cannot be blank.");
      return;
    }

    if (!year.trim()) {
      setError("Year is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    let uploadedPath: string | null = null;

    try {
      const renamedFile =
        trimmedName === selectedFile.name
          ? selectedFile
          : new File([selectedFile], trimmedName, {
              type: selectedFile.type,
              lastModified: selectedFile.lastModified,
            });

      uploadedPath = await uploadFileToStorage({
        supabase,
        userId,
        file: renamedFile,
        year,
        category: BOT_DEFAULT_CATEGORY,
        fileName: trimmedName,
      });

      const extractedText = await extractReadableText(renamedFile);
      const summaryResult = await requestSummary({
        supabase,
        input: {
          name: trimmedName,
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
          name: trimmedName,
          file_path: uploadedPath,
          file_url: null,
          year,
          category: BOT_DEFAULT_CATEGORY,
          file_type: detectFileType(trimmedName),
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
        toast.warning("File uploaded. A basic summary was saved.");
      } else {
        toast.success("File uploaded.");
      }

      await onUploaded(data as BotFileRecord);
      onOpenChange(false);
      resetForm();
    } catch (submitError) {
      if (supabase && uploadedPath) {
        await supabase.storage.from(BOT_STORAGE_BUCKET).remove([uploadedPath]);
      }

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
      <DialogContent className="max-w-xl rounded-[1.75rem] border border-slate-200 bg-white p-0">
        <DialogHeader className="border-b border-slate-200 px-6 py-5">
          <DialogTitle className="text-xl font-semibold text-slate-950">
            Upload file
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Add a file, assign its year, and store it securely.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5 px-6 py-6" onSubmit={handleSubmit}>
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
                {selectedFile ? selectedFile.name : "Choose a file from your device"}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {selectedFile
                  ? `${formatFileSize(selectedFile.size)} - ${detectFileType(selectedFile.name)}`
                  : "PDF, DOCX, XLSX, CSV, TXT, and similar files"}
              </p>
            </label>
            <input
              id="upload-file"
              type="file"
              className="hidden"
              onChange={(event) => {
                const nextFile = event.target.files?.[0] ?? null;
                setSelectedFile(nextFile);
                setName(nextFile?.name ?? "");
              }}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
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

            <div className="space-y-2">
              <Label>Year</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="h-11 w-full rounded-2xl">
                  <SelectValue placeholder="Choose a year" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(new Set([currentYear, ...BOT_DEFAULT_YEARS]))
                    .sort((a, b) => Number(b) - Number(a))
                    .map((value) => (
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
              {isSubmitting ? "Uploading..." : "Upload file"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
