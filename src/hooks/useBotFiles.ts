import * as React from "react";

import { detectFileType, sanitizeFileName } from "@/lib/file-utils";
import { buildStoragePath, deleteStoredFile, moveStoredFile } from "@/lib/storage";
import { supabase } from "@/lib/supabaseClient";
import type { BotFileRecord } from "@/types/database";

export function useBotFiles(userId: string | undefined) {
  const [files, setFiles] = React.useState<BotFileRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    if (!supabase || !userId) {
      setFiles([]);
      setIsLoading(false);
      return [] as BotFileRecord[];
    }

    setIsLoading(true);
    setError(null);

    const { data, error: queryError } = await supabase
      .from("bot_files")
      .select("*")
      .order("created_at", { ascending: false });

    if (queryError) {
      setFiles([]);
      setError(queryError.message);
      setIsLoading(false);
      return [];
    }

    const nextFiles = (data ?? []) as BotFileRecord[];
    setFiles(nextFiles);
    setIsLoading(false);
    return nextFiles;
  }, [userId]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const renameFile = React.useCallback(async (file: BotFileRecord, nextName: string) => {
    if (!supabase) {
      throw new Error("Supabase is not configured.");
    }

    const sanitizedName = sanitizeFileName(nextName);
    if (!sanitizedName) {
      throw new Error("File name cannot be blank.");
    }

    if (sanitizedName === file.name) {
      return file;
    }

    const nextPath = buildStoragePath({
      userId: file.user_id,
      year: file.year,
      category: file.category,
      fileName: sanitizedName,
    });

    await moveStoredFile({
      supabase,
      sourcePath: file.file_path,
      destinationPath: nextPath,
    });

    const { data, error: updateError } = await supabase
      .from("bot_files")
      .update({
        name: sanitizedName,
        file_path: nextPath,
        file_type: detectFileType(sanitizedName),
      })
      .eq("id", file.id)
      .select("*")
      .single();

    if (updateError) {
      try {
        await moveStoredFile({
          supabase,
          sourcePath: nextPath,
          destinationPath: file.file_path,
        });
      } catch {
        // Keep the original database error as the primary failure surfaced to the UI.
      }

      throw updateError;
    }

    const nextFile = data as BotFileRecord;
    setFiles((currentFiles) =>
      currentFiles.map((currentFile) =>
        currentFile.id === nextFile.id ? nextFile : currentFile,
      ),
    );

    return nextFile;
  }, []);

  const deleteFile = React.useCallback(async (file: BotFileRecord) => {
    if (!supabase) {
      throw new Error("Supabase is not configured.");
    }

    const { error: deleteRecordError } = await supabase
      .from("bot_files")
      .delete()
      .eq("id", file.id);

    if (deleteRecordError) {
      throw deleteRecordError;
    }

    setFiles((currentFiles) =>
      currentFiles.filter((currentFile) => currentFile.id !== file.id),
    );

    await deleteStoredFile({
      supabase,
      filePath: file.file_path,
    });
  }, []);

  const updateFileSummary = React.useCallback(
    async (file: BotFileRecord, nextSummary: string) => {
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      const { data, error: updateError } = await supabase
        .from("bot_files")
        .update({
          summary: nextSummary,
        })
        .eq("id", file.id)
        .select("*")
        .single();

      if (updateError) {
        throw updateError;
      }

      const nextFile = data as BotFileRecord;
      setFiles((currentFiles) =>
        currentFiles.map((currentFile) =>
          currentFile.id === nextFile.id ? nextFile : currentFile,
        ),
      );

      return nextFile;
    },
    [],
  );

  return {
    files,
    isLoading,
    error,
    refresh,
    renameFile,
    deleteFile,
    updateFileSummary,
  };
}
