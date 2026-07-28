import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  CalendarDays,
  Clock3,
  Download,
  FileText,
  HardDrive,
  LayoutGrid,
  List,
  Loader2,
  LogOut,
  PencilLine,
  Plus,
  Search,
  Sparkles,
  Star,
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
import { useBotFiles } from "@/hooks/useBotFiles";
import {
  buildStoragePathLabel,
  buildYearOptions,
  formatDate,
  formatDateStamp,
  formatFileSize,
  getFileIcon,
  getInitials,
} from "@/lib/file-utils";
import { cn } from "@/lib/utils";
import { extractReadableText, isGenericSummary, requestSummary } from "@/lib/summary";
import {
  createSignedDownloadUrl,
  createSignedPreviewUrl,
  downloadStoredFile,
} from "@/lib/storage";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/providers/auth-provider";
import type { BotFileRecord } from "@/types/database";

const CUSTOM_YEAR_STORAGE_KEY = "bot-storage-custom-years";

type ViewMode = "list" | "grid";
type NavMode = "my-drive" | "recent" | "starred" | "archives";

function MetricCard({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: string;
  note: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <motion.div
      layout
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="flex min-h-28 items-start justify-between gap-4 bg-white p-4"
    >
      <div>
        <p className="industrial-label text-[#68655e]">{label}</p>
        <p className="mt-3 text-[1.9rem] font-bold leading-none tracking-[-0.04em] text-[#111111]">
          {value}
        </p>
        <p className="industrial-meta mt-2 text-[#68655e]">{note}</p>
      </div>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#111111] text-[#111111]">
        <Icon className="h-4 w-4" />
      </div>
    </motion.div>
  );
}

function SidebarButton({
  label,
  active,
  badge,
  icon: Icon,
  onClick,
}: {
  label: string;
  active: boolean;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex min-h-12 w-full items-center justify-between border-b border-[#c9c6bd] px-3 py-2.5 text-left text-sm transition-colors",
        active
          ? "border-l-2 border-l-[#d8241f] bg-[#111111] text-white"
          : "border-l-2 border-l-transparent text-[#3f3d38] hover:border-l-[#d8241f] hover:bg-white hover:text-[#111111]",
      )}
    >
      <span className="flex items-center gap-3">
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center border",
            active
              ? "border-white/40 text-white"
              : "border-[#c9c6bd] bg-[#f2f0ea] text-[#4f4c46] group-hover:border-[#111111]",
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="font-semibold">{label}</span>
      </span>
      <span
        className={cn(
          "industrial-meta min-w-7 text-right",
          active ? "text-white" : "text-[#68655e]",
        )}
      >
        {badge}
      </span>
    </button>
  );
}

function YearFolderButton({
  year,
  active,
  count,
  onClick,
}: {
  year: string;
  active: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-11 w-full items-center justify-between border-b border-[#c9c6bd] px-3 text-sm transition-colors",
        active
          ? "border-l-2 border-l-[#d8241f] bg-white text-[#111111]"
          : "border-l-2 border-l-transparent text-[#4f4c46] hover:bg-white hover:text-[#111111]",
      )}
    >
      <span className="font-mono text-xs font-medium tracking-[0.06em]">{year}</span>
      <span
        className="font-mono text-[11px] text-[#68655e]"
      >
        {count}
      </span>
    </button>
  );
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="border border-dashed border-[#9e9a91] bg-[#f2f0ea] px-6 py-14 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center border border-[#111111] bg-white text-[#111111]">
        <FileText className="h-5 w-5" />
      </div>
      <h3 className="mt-5 text-xl font-bold tracking-[-0.025em] text-[#111111]">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#68655e]">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

function LoadingBrowser() {
  return (
    <div className="border border-[#c9c6bd]">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="border-b border-[#c9c6bd] bg-white p-4 last:border-b-0"
        >
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 animate-pulse bg-[#e1ded6]" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-40 animate-pulse bg-[#e1ded6]" />
              <div className="h-3 w-64 animate-pulse bg-[#e1ded6]" />
            </div>
            <div className="hidden h-9 w-28 animate-pulse bg-[#e1ded6] sm:block" />
          </div>
        </div>
      ))}
    </div>
  );
}

function DeleteDropdownAction({
  fileName,
  isOpen,
  isDeleting,
  triggerMode,
  onOpenChange,
  onConfirm,
}: {
  fileName: string;
  isOpen: boolean;
  isDeleting: boolean;
  triggerMode: "desktop" | "mobile";
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const isDesktop = triggerMode === "desktop";

  return (
    <div onClick={(event) => event.stopPropagation()}>
      <Button
        type="button"
        variant={isDesktop ? "ghost" : "outline"}
        size={isDesktop ? "icon-sm" : "sm"}
        className={cn(
          isDesktop
            ? "text-[#68655e] hover:bg-[#f2f0ea] hover:text-[#d8241f]"
            : "border-[#d8241f] text-[#d8241f] hover:bg-[#d8241f] hover:text-white",
        )}
        onClick={(event) => {
          event.stopPropagation();
          onOpenChange(!isOpen);
        }}
        disabled={isDeleting}
      >
        <Trash2 className="h-4 w-4" />
        {isDesktop ? <span className="sr-only">Delete file</span> : "Delete"}
      </Button>

      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent
          className="industrial-surface border border-[#c9c6bd] bg-white p-0 sm:max-w-md"
          showCloseButton={!isDeleting}
          onClick={(event) => event.stopPropagation()}
        >
          <DialogHeader className="px-6 pb-2 pt-6">
            <DialogTitle className="text-xl text-[#111111]">Delete file?</DialogTitle>
            <DialogDescription className="break-words text-[#68655e]">
              Permanently delete <strong className="font-semibold text-[#111111]">{fileName}</strong>.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="border-t border-[#c9c6bd] bg-white px-6 py-4">
            <Button
              type="button"
              variant="outline"
              className="border-[#c9c6bd] bg-white"
              onClick={() => onOpenChange(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="border-[#d8241f] bg-[#d8241f] text-white hover:bg-[#b91f1b]"
              onClick={onConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isDeleting ? "Deleting..." : "Delete file"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
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

function FileCard({
  file,
  isSelected,
  isDownloading,
  isDeleting,
  isDeleteOpen,
  onOpen,
  onRename,
  onDownload,
  onToggleStar,
  onDeleteToggle,
  onDeleteCancel,
  onDeleteConfirm,
}: {
  file: BotFileRecord;
  isSelected: boolean;
  isDownloading: boolean;
  isDeleting: boolean;
  isDeleteOpen: boolean;
  onOpen: () => void;
  onRename: () => void;
  onDownload: () => void;
  onToggleStar: () => void;
  onDeleteToggle: () => void;
  onDeleteCancel: () => void;
  onDeleteConfirm: () => void;
}) {
  const Icon = getFileIcon(file.file_type);

  return (
    <motion.div
      role="button"
      tabIndex={0}
      layout
      transition={{ duration: 0.16, ease: "easeOut" }}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
        className={cn(
          "group relative w-full overflow-hidden border bg-white p-4 text-left transition-colors",
          isSelected
          ? "dashboard-outline bg-white before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-[#d8241f]"
          : "dashboard-outline hover:border-[#111111] hover:bg-[#f8f7f3]",
        )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-[#111111] bg-[#f2f0ea] text-[#111111]">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[#111111]">{file.name}</p>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#68655e]">
              {file.summary?.trim() || "No saved summary yet for this file."}
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={cn(
            file.is_starred
              ? "text-[#d8241f] hover:bg-[#f2f0ea]"
              : "text-[#8a867e] hover:bg-[#f2f0ea] hover:text-[#111111]",
          )}
          onClick={(event) => {
            event.stopPropagation();
            onToggleStar();
          }}
        >
          <Star className={cn("h-4 w-4", file.is_starred ? "fill-current" : "")} />
          <span className="sr-only">Toggle star</span>
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className="border-[#111111] bg-white px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[#111111]"
        >
          {file.category}
        </Badge>
        <Badge
          variant="outline"
          className="border-[#c9c6bd] bg-white px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[#4f4c46]"
        >
          {file.file_type ?? "FILE"}
        </Badge>
        <Badge
          variant="outline"
          className="border-[#c9c6bd] bg-[#f2f0ea] px-2.5 py-1 font-mono text-[10px] tracking-[0.08em] text-[#4f4c46]"
        >
          {file.year}
        </Badge>
      </div>

      <div className="industrial-meta mt-4 flex items-center justify-between gap-3 text-[#68655e]">
        <span>{formatFileSize(file.file_size)}</span>
        <span>{formatDateStamp(file.updated_at)}</span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-[#c9c6bd] bg-white hover:border-[#111111]"
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
          className="border-[#c9c6bd] bg-white hover:border-[#111111]"
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
        <DeleteDropdownAction
          fileName={file.name}
          isOpen={isDeleteOpen}
          isDeleting={isDeleting}
          triggerMode="mobile"
          onOpenChange={(open) => {
            if (open) {
              onDeleteToggle();
            } else {
              onDeleteCancel();
            }
          }}
          onConfirm={onDeleteConfirm}
        />
      </div>
    </motion.div>
  );
}

function FileRow({
  file,
  isSelected,
  isDownloading,
  isDeleting,
  isDeleteOpen,
  onOpen,
  onRename,
  onDownload,
  onToggleStar,
  onDeleteToggle,
  onDeleteCancel,
  onDeleteConfirm,
}: {
  file: BotFileRecord;
  isSelected: boolean;
  isDownloading: boolean;
  isDeleting: boolean;
  isDeleteOpen: boolean;
  onOpen: () => void;
  onRename: () => void;
  onDownload: () => void;
  onToggleStar: () => void;
  onDeleteToggle: () => void;
  onDeleteCancel: () => void;
  onDeleteConfirm: () => void;
}) {
  const Icon = getFileIcon(file.file_type);

  return (
    <motion.div layout transition={{ duration: 0.18, ease: "easeOut" }}>
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpen();
          }
        }}
        className={cn(
          "relative grid cursor-pointer gap-3 border-b border-[#c9c6bd] px-4 py-4 transition-colors md:grid-cols-[minmax(0,1.6fr)_0.8fr_0.7fr_0.8fr_auto] md:gap-4",
          isSelected
            ? "bg-white before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-[#d8241f]"
            : "bg-white hover:bg-[#f8f7f3]",
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center border border-[#111111] bg-[#f2f0ea] text-[#111111]">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-bold text-[#111111]">{file.name}</p>
              {file.is_starred ? (
                <Star className="h-3.5 w-3.5 fill-[#d8241f] text-[#d8241f]" />
              ) : null}
            </div>
            <p className="mt-1 truncate text-xs text-[#68655e]">
              {file.summary?.trim() || "No saved summary yet"}
            </p>
          </div>
        </div>

        <div className="flex items-center md:justify-start">
          <Badge
            variant="outline"
            className="border-[#111111] bg-white px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[#111111]"
          >
            {file.category}
          </Badge>
        </div>

        <div className="industrial-meta flex items-center text-[#4f4c46]">
          {file.file_type ?? "FILE"}
        </div>

        <div className="industrial-meta flex items-center gap-3 text-[#68655e]">
          <span>{file.year}</span>
          <span className="text-[#c9c6bd]">/</span>
          <span>{formatFileSize(file.file_size)}</span>
        </div>

        <div
          className="flex items-center justify-end gap-1"
          onClick={(event) => event.stopPropagation()}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={cn(
              file.is_starred
                ? "text-[#d8241f] hover:bg-[#f2f0ea]"
                : "text-[#8a867e] hover:bg-[#f2f0ea] hover:text-[#111111]",
            )}
            onClick={onToggleStar}
          >
            <Star className={cn("h-4 w-4", file.is_starred ? "fill-current" : "")} />
            <span className="sr-only">Toggle star</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-[#68655e] hover:bg-[#f2f0ea] hover:text-[#111111]"
            onClick={onRename}
          >
            <PencilLine className="h-4 w-4" />
            <span className="sr-only">Rename file</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-[#68655e] hover:bg-[#f2f0ea] hover:text-[#111111]"
            onClick={onDownload}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span className="sr-only">Download file</span>
          </Button>
          <DeleteDropdownAction
            fileName={file.name}
            isOpen={isDeleteOpen}
            isDeleting={isDeleting}
            triggerMode="desktop"
            onOpenChange={(open) => {
              if (open) {
                onDeleteToggle();
              } else {
                onDeleteCancel();
              }
            }}
            onConfirm={onDeleteConfirm}
          />
        </div>
      </div>
    </motion.div>
  );
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border-b border-[#c9c6bd] py-3 last:border-b-0">
      <p className="industrial-label text-[#68655e]">{label}</p>
      <p className="industrial-meta mt-1.5 break-words font-medium text-[#111111]">
        {value}
      </p>
    </div>
  );
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
    toggleStar,
  } = useBotFiles(user?.id);

  const [searchQuery, setSearchQuery] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [yearFilter, setYearFilter] = React.useState("all");
  const [activeNav, setActiveNav] = React.useState<NavMode>("my-drive");
  const [viewMode, setViewMode] = React.useState<ViewMode>("list");
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);
  const [isYearDialogOpen, setIsYearDialogOpen] = React.useState(false);
  const [isSigningOut, setIsSigningOut] = React.useState(false);
  const [isRenaming, setIsRenaming] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [customYears, setCustomYears] = React.useState<string[]>([]);
  const [pendingYear, setPendingYear] = React.useState("");
  const [deleteMenuFileId, setDeleteMenuFileId] = React.useState<string | null>(null);
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
  const summaryAttemptedIds = React.useRef(new Set<string>());

  React.useEffect(() => {
    document.title = "GCC BOT File Storage";
  }, []);

  React.useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(CUSTOM_YEAR_STORAGE_KEY);
      if (!storedValue) {
        return;
      }

      const parsedValue = JSON.parse(storedValue);
      if (!Array.isArray(parsedValue)) {
        return;
      }

      setCustomYears(
        Array.from(
          new Set(
            parsedValue
              .map((value) => String(value).trim())
              .filter((value) => /^\d{4}$/.test(value)),
          ),
        ).sort((a, b) => Number(b) - Number(a)),
      );
    } catch {
      window.localStorage.removeItem(CUSTOM_YEAR_STORAGE_KEY);
    }
  }, []);

  const years = React.useMemo(() => buildYearOptions(files, customYears), [files, customYears]);
  const fileTypes = React.useMemo(
    () =>
      Array.from(new Set(files.map((file) => file.file_type ?? "FILE"))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [files],
  );

  const sortedFiles = React.useMemo(
    () =>
      [...files].sort(
        (a, b) =>
          new Date(b.updated_at ?? b.created_at).getTime() -
          new Date(a.updated_at ?? a.created_at).getTime(),
      ),
    [files],
  );

  const currentYear = String(new Date().getFullYear());
  const recentThreshold = React.useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 45);
    return date.getTime();
  }, []);

  const filteredFiles = React.useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return sortedFiles.filter((file) => {
      const matchesYear = yearFilter === "all" || file.year === yearFilter;
      const normalizedType = file.file_type ?? "FILE";
      const matchesType = typeFilter === "all" || normalizedType === typeFilter;
      const matchesNav =
        activeNav === "my-drive"
          ? true
          : activeNav === "recent"
            ? new Date(file.updated_at ?? file.created_at).getTime() >= recentThreshold
            : activeNav === "starred"
              ? file.is_starred
              : Number(file.year) < Number(currentYear);
      const haystack = [
        file.name,
        file.year,
        file.file_type ?? "",
        file.uploader ?? "",
        file.category ?? "",
        file.summary ?? "",
        file.description ?? "",
      ]
        .join(" ")
        .toLowerCase();
      const matchesQuery =
        normalizedQuery.length === 0 || haystack.includes(normalizedQuery);

      return matchesYear && matchesType && matchesNav && matchesQuery;
    });
  }, [activeNav, currentYear, recentThreshold, searchQuery, sortedFiles, typeFilter, yearFilter]);

  const totalBytes = React.useMemo(
    () => files.reduce((sum, file) => sum + (file.file_size ?? 0), 0),
    [files],
  );

  const latestFile = sortedFiles[0] ?? null;
  const previewKind = React.useMemo(() => getPreviewKind(previewFile), [previewFile]);
  const recentCount = React.useMemo(
    () =>
      files.filter(
        (file) =>
          new Date(file.updated_at ?? file.created_at).getTime() >= recentThreshold,
      ).length,
    [files, recentThreshold],
  );
  const archiveCount = React.useMemo(
    () => files.filter((file) => Number(file.year) < Number(currentYear)).length,
    [currentYear, files],
  );
  const starredCount = React.useMemo(
    () => files.filter((file) => file.is_starred).length,
    [files],
  );

  React.useEffect(() => {
    if (!previewFile) {
      return;
    }

    const nextMatch = files.find((file) => file.id === previewFile.id);
    if (nextMatch && nextMatch !== previewFile) {
      setPreviewFile(nextMatch);
    }
  }, [files, previewFile]);

  React.useEffect(() => {
    if (filteredFiles.length === 0) {
      if (previewFile && !files.some((file) => file.id === previewFile.id)) {
        setPreviewFile(null);
      }
      return;
    }

    if (!previewFile) {
      setPreviewFile(filteredFiles[0]);
      return;
    }

    const isVisible = filteredFiles.some((file) => file.id === previewFile.id);
    if (!isVisible) {
      setPreviewFile(filteredFiles[0]);
    }
  }, [files, filteredFiles, previewFile]);

  function persistCustomYears(nextYears: string[]) {
    setCustomYears(nextYears);

    try {
      window.localStorage.setItem(CUSTOM_YEAR_STORAGE_KEY, JSON.stringify(nextYears));
    } catch {
      toast.error("Unable to save the new year on this browser.");
    }
  }

  function handleAddYearSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedYear = pendingYear.replace(/[^\d]/g, "").slice(0, 4);

    if (!/^\d{4}$/.test(normalizedYear)) {
      toast.error("Enter a valid 4-digit year.");
      return;
    }

    if (years.includes(normalizedYear)) {
      setYearFilter(normalizedYear);
      setIsYearDialogOpen(false);
      setPendingYear("");
      toast("That year already exists.");
      return;
    }

    const nextYears = Array.from(new Set([...customYears, normalizedYear])).sort(
      (a, b) => Number(b) - Number(a),
    );
    persistCustomYears(nextYears);
    setYearFilter(normalizedYear);
    setIsYearDialogOpen(false);
    setPendingYear("");
    toast.success(`Year ${normalizedYear} added.`);
  }

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
      .catch((previewLoadError) => {
        if (!isActive) {
          return;
        }

        setPreviewError(
          previewLoadError instanceof Error
            ? previewLoadError.message
            : "Unable to load preview.",
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

  async function handleUploadComplete(uploadedFiles: BotFileRecord[]) {
    if (uploadedFiles.length > 0) {
      setPreviewFile(uploadedFiles[uploadedFiles.length - 1]);
    }

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

  function handleDownloadSummary(file: BotFileRecord) {
    const summaryDocument = [
      `File Name: ${file.name}`,
      `Year: ${file.year}`,
      `Category: ${file.category}`,
      `Uploaded: ${formatDate(file.created_at)}`,
      "",
      "Summary:",
      file.summary?.trim() || "No summary available.",
      "",
      "Description:",
      file.description?.trim() || "No description available.",
    ].join("\n");

    const blob = new Blob([summaryDocument], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${file.name.replace(/\.[^/.]+$/, "")}-summary.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
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

  async function handleDeleteConfirm(file: BotFileRecord) {
    setIsDeleting(true);

    try {
      await deleteFile(file);
      if (previewFile?.id === file.id) {
        setPreviewFile(null);
      }
      toast.success("File deleted.");
      setDeleteMenuFileId(null);
    } catch (deleteError) {
      toast.error(
        deleteError instanceof Error ? deleteError.message : "Unable to delete file.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleToggleStar(file: BotFileRecord) {
    try {
      const nextFile = await toggleStar(file);
      if (previewFile?.id === nextFile.id) {
        setPreviewFile(nextFile);
      }
    } catch (toggleError) {
      toast.error(
        toggleError instanceof Error ? toggleError.message : "Unable to update star.",
      );
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
    <div className="dashboard-white industrial-ui theme min-h-screen w-full max-w-full overflow-x-hidden bg-white text-[#111111]">
      <div className="w-full">
        <div className="grid min-h-screen lg:grid-cols-[240px_minmax(0,1fr)] 2xl:grid-cols-[240px_minmax(0,1fr)_380px]">
          <aside className="border-b border-[#111111] bg-white lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
            <Card className="flex h-full flex-col border-0 bg-transparent p-4 sm:p-5">
              <div className="flex items-center gap-3 border-b border-[#111111] pb-5">
                <img
                  src={collegeLogo}
                  alt="Goa Community College logo"
                  className="h-12 w-12 border border-[#111111] bg-white object-cover"
                />
                <div className="min-w-0">
                  <p className="industrial-label text-[#d8241f]">
                    BOT Drive
                  </p>
                  <h2 className="truncate text-base font-extrabold uppercase tracking-[-0.025em] text-[#111111]">
                    GCC Archive
                  </h2>
                </div>
              </div>

              <Button
                type="button"
                className="mt-5 h-12 w-full border border-[#d8241f] bg-[#d8241f] font-mono text-xs uppercase tracking-[0.08em] text-white hover:bg-[#b91f1b]"
                onClick={() => setIsUploadOpen(true)}
              >
                <Upload className="h-4 w-4" />
                New Upload
              </Button>

              <nav className="mt-6 border-t border-[#c9c6bd]" aria-label="File navigation">
                <SidebarButton
                  label="My Drive"
                  active={activeNav === "my-drive"}
                  badge={String(files.length)}
                  icon={FileText}
                  onClick={() => setActiveNav("my-drive")}
                />
                <SidebarButton
                  label="Recent"
                  active={activeNav === "recent"}
                  badge={String(recentCount)}
                  icon={Clock3}
                  onClick={() => setActiveNav("recent")}
                />
                <SidebarButton
                  label="Starred"
                  active={activeNav === "starred"}
                  badge={String(starredCount)}
                  icon={Star}
                  onClick={() => setActiveNav("starred")}
                />
                <SidebarButton
                  label="BOT Archives"
                  active={activeNav === "archives"}
                  badge={String(archiveCount)}
                  icon={Archive}
                  onClick={() => setActiveNav("archives")}
                />
              </nav>

              <div className="mt-7">
                <div className="flex items-center justify-between border-b border-[#111111] px-1 pb-3">
                  <p className="industrial-label text-[#68655e]">
                    Year Folders
                  </p>
                  <button
                    type="button"
                    onClick={() => setYearFilter("all")}
                    className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#68655e] hover:text-[#d8241f]"
                  >
                    Reset
                  </button>
                </div>
                <div>
                  {years.map((year) => (
                    <YearFolderButton
                      key={year}
                      year={year}
                      count={files.filter((file) => file.year === year).length}
                      active={yearFilter === year}
                      onClick={() => setYearFilter(yearFilter === year ? "all" : year)}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-auto hidden border-t border-[#111111] pt-4 lg:block">
                <p className="industrial-label text-[#68655e]">Storage used</p>
                <div className="mt-3 h-2 border border-[#111111] bg-white">
                  <div
                    className="h-full bg-[#d8241f]"
                    style={{ width: `${Math.min(100, files.length ? 28 : 0)}%` }}
                  />
                </div>
                <p className="industrial-meta mt-2 text-[#4f4c46]">
                  {formatFileSize(totalBytes)} indexed
                </p>
              </div>
            </Card>
          </aside>

          <main className="min-w-0 bg-white">
            <Card className="border-0 border-b border-[#111111] bg-white p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <p className="industrial-label text-[#d8241f]">Goa Community College</p>
                  <h1 className="industrial-display mt-4 max-w-5xl">
                    BOT Files
                  </h1>
                  <p className="mt-5 max-w-2xl text-sm leading-6 text-[#4f4c46]">
                    Search, review, and safely download the college&apos;s BOT records from one
                    controlled workspace.
                  </p>
                </div>

                <div className="flex flex-col gap-3 xl:items-end">
                  <div className="dashboard-outline flex items-center gap-3 self-start border bg-white px-3 py-2 xl:self-auto">
                    <div className="flex h-10 w-10 items-center justify-center bg-[#111111] font-mono text-xs font-semibold text-white">
                      {getInitials(user?.email ?? "BOT Drive")}
                    </div>
                    <div className="min-w-0">
                      <p className="industrial-label text-[#68655e]">Signed in as</p>
                      <p className="industrial-meta mt-1 truncate font-medium text-[#111111]">
                        {user?.email ?? "Unknown user"}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-2 font-mono text-[11px] uppercase tracking-[0.06em] text-[#68655e] hover:bg-[#f2f0ea] hover:text-[#111111]"
                      onClick={() => void handleSignOut()}
                      disabled={isSigningOut}
                    >
                      <LogOut className="h-4 w-4" />
                      {isSigningOut ? "Signing out..." : "Sign out"}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="industrial-rule-grid mt-8 grid-flow-dense grid-cols-2 border border-[#c9c6bd] xl:grid-cols-4">
                <MetricCard
                  label="Total Files"
                  value={String(files.length)}
                  note="Stored BOT file records"
                  icon={FileText}
                />
                <MetricCard
                  label="Year Groups"
                  value={String(new Set(files.map((file) => file.year)).size)}
                  note="Available folder years"
                  icon={CalendarDays}
                />
                <MetricCard
                  label="Latest Update"
                  value={latestFile ? formatDateStamp(latestFile.updated_at) : "--"}
                  note="Most recent file activity"
                  icon={Clock3}
                />
                <MetricCard
                  label="Stored Size"
                  value={formatFileSize(totalBytes)}
                  note="Total uploaded storage"
                  icon={HardDrive}
                />
              </div>
            </Card>

            <Card className="border-0 bg-white p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <h2 className="text-2xl font-extrabold uppercase tracking-[-0.035em] text-[#111111]">
                      File Browser
                    </h2>
                    <p className="mt-1 text-sm text-[#68655e]">
                      Search by file name, summary, year, type, or supporting details.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant={viewMode === "list" ? "default" : "outline"}
                      className={cn(
                        "min-h-11 border font-mono text-xs uppercase tracking-[0.06em]",
                        viewMode === "list"
                          ? "border-[#111111] bg-[#111111] text-white hover:bg-[#2a2a2a]"
                          : "border-[#c9c6bd] bg-white hover:border-[#111111]",
                      )}
                      onClick={() => setViewMode("list")}
                    >
                      <List className="h-4 w-4" />
                      List
                    </Button>
                    <Button
                      type="button"
                      variant={viewMode === "grid" ? "default" : "outline"}
                      className={cn(
                        "min-h-11 border font-mono text-xs uppercase tracking-[0.06em]",
                        viewMode === "grid"
                          ? "border-[#111111] bg-[#111111] text-white hover:bg-[#2a2a2a]"
                          : "border-[#c9c6bd] bg-white hover:border-[#111111]",
                      )}
                      onClick={() => setViewMode("grid")}
                    >
                      <LayoutGrid className="h-4 w-4" />
                      Grid
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11 border-[#c9c6bd] bg-white font-mono text-xs uppercase tracking-[0.06em] hover:border-[#111111]"
                      onClick={() => setIsYearDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Add year
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2 bg-white xl:grid-cols-[minmax(0,1fr)_170px_170px]">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#68655e]" />
                    <Input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      className="dashboard-outline h-12 border bg-white pl-11 font-mono text-xs shadow-none focus-visible:ring-2 focus-visible:ring-inset"
                      placeholder="Search files, summaries, descriptions, and years"
                    />
                  </div>

                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="dashboard-outline h-12 border bg-white font-mono text-xs uppercase tracking-[0.04em]">
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      {fileTypes.map((fileType) => (
                        <SelectItem key={fileType} value={fileType}>
                          {fileType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={yearFilter} onValueChange={setYearFilter}>
                    <SelectTrigger className="dashboard-outline h-12 border bg-white font-mono text-xs uppercase tracking-[0.04em]">
                      <SelectValue placeholder="All years" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All years</SelectItem>
                      {years.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="dashboard-outline flex flex-wrap items-center gap-2 border bg-white p-2">
                  <Badge
                    variant="outline"
                    className="dashboard-outline border bg-white px-3 py-2 font-mono text-[10px] uppercase tracking-[0.08em] text-[#4f4c46]"
                  >
                    {activeNav === "my-drive"
                      ? "My Drive"
                      : activeNav === "recent"
                        ? "Recent"
                        : activeNav === "starred"
                          ? "Starred"
                          : "BOT Archives"}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="dashboard-outline border bg-white px-3 py-2 font-mono text-[10px] uppercase tracking-[0.08em] text-[#4f4c46]"
                  >
                    {filteredFiles.length} visible
                  </Badge>
                  {yearFilter !== "all" ? (
                    <Badge
                      variant="outline"
                      className="border-0 bg-[#d8241f] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.08em] text-white"
                    >
                      Year {yearFilter}
                    </Badge>
                  ) : null}
                  {typeFilter !== "all" ? (
                    <Badge
                      variant="outline"
                      className="border-0 bg-white px-3 py-2 font-mono text-[10px] uppercase tracking-[0.08em] text-[#111111]"
                    >
                      Type {typeFilter}
                    </Badge>
                  ) : null}
                </div>

                {isLoading ? (
                  <LoadingBrowser />
                ) : error ? (
                  <div className="border border-[#d8241f] bg-[#fff5f4] px-4 py-4 text-sm text-[#b91f1b]">
                    {error}
                  </div>
                ) : files.length === 0 ? (
                  <EmptyState
                    title="No files yet"
                    description="Upload your first BOT file to start building this workspace."
                    action={
                      <Button
                        type="button"
                        className="border border-[#d8241f] bg-[#d8241f] font-mono text-xs uppercase tracking-[0.06em] text-white hover:bg-[#b91f1b]"
                        onClick={() => setIsUploadOpen(true)}
                      >
                        <Upload className="h-4 w-4" />
                        Upload file
                      </Button>
                    }
                  />
                ) : filteredFiles.length === 0 ? (
                  <EmptyState
                    title="No matching files"
                    description="Try a broader search, switch the year folder, or reset the current filters."
                    action={
                      <Button
                        type="button"
                        variant="outline"
                        className="border-[#111111] bg-white font-mono text-xs uppercase tracking-[0.06em]"
                        onClick={() => {
                          setSearchQuery("");
                          setTypeFilter("all");
                          setYearFilter("all");
                          setActiveNav("my-drive");
                        }}
                      >
                        Reset filters
                      </Button>
                    }
                  />
                ) : viewMode === "grid" ? (
                  <div className="grid grid-flow-dense gap-3 md:grid-cols-2 2xl:grid-cols-3">
                    {filteredFiles.map((file) => (
                      <FileCard
                        key={file.id}
                        file={file}
                        isSelected={previewFile?.id === file.id}
                        isDownloading={downloadingFileId === file.id}
                        isDeleting={isDeleting && deleteMenuFileId === file.id}
                        isDeleteOpen={deleteMenuFileId === file.id}
                        onOpen={() => {
                          setDeleteMenuFileId(null);
                          setPreviewFile(file);
                        }}
                        onRename={() => {
                          setDeleteMenuFileId(null);
                          setRenameTarget(file);
                          setRenameName(file.name);
                        }}
                        onDownload={() => {
                          setDeleteMenuFileId(null);
                          void handleDownload(file);
                        }}
                        onToggleStar={() => {
                          setDeleteMenuFileId(null);
                          void handleToggleStar(file);
                        }}
                        onDeleteToggle={() =>
                          setDeleteMenuFileId((current) =>
                            current === file.id ? null : file.id,
                          )
                        }
                        onDeleteCancel={() => setDeleteMenuFileId(null)}
                        onDeleteConfirm={() => {
                          void handleDeleteConfirm(file);
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="dashboard-outline border bg-white">
                    <div className="dashboard-outline industrial-label hidden grid-cols-[minmax(0,1.6fr)_0.8fr_0.7fr_0.8fr_auto] gap-4 border-b bg-white px-4 py-3 text-[#4f4c46] md:grid">
                      <div>Name</div>
                      <div>Category</div>
                      <div>Type</div>
                      <div>Year / Size</div>
                      <div className="text-right">Actions</div>
                    </div>
                    <div>
                      {filteredFiles.map((file) => (
                        <FileRow
                          key={file.id}
                          file={file}
                          isSelected={previewFile?.id === file.id}
                          isDownloading={downloadingFileId === file.id}
                          isDeleting={isDeleting && deleteMenuFileId === file.id}
                          isDeleteOpen={deleteMenuFileId === file.id}
                          onOpen={() => {
                            setDeleteMenuFileId(null);
                            setPreviewFile(file);
                          }}
                          onRename={() => {
                            setDeleteMenuFileId(null);
                            setRenameTarget(file);
                            setRenameName(file.name);
                          }}
                          onDownload={() => {
                            setDeleteMenuFileId(null);
                            void handleDownload(file);
                          }}
                          onToggleStar={() => {
                            setDeleteMenuFileId(null);
                            void handleToggleStar(file);
                          }}
                          onDeleteToggle={() =>
                            setDeleteMenuFileId((current) =>
                              current === file.id ? null : file.id,
                            )
                          }
                          onDeleteCancel={() => setDeleteMenuFileId(null)}
                          onDeleteConfirm={() => {
                            void handleDeleteConfirm(file);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </main>

          <aside className="border-t border-[#111111] bg-white 2xl:sticky 2xl:top-0 2xl:h-screen 2xl:overflow-y-auto 2xl:border-l 2xl:border-t-0">
            <Card className="border-0 bg-transparent p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3 border-b border-[#111111] pb-4">
                <div>
                  <p className="industrial-label text-[#d8241f]">
                    File Details
                  </p>
                  <h2 className="mt-2 text-xl font-extrabold uppercase tracking-[-0.035em] text-[#111111]">
                    {previewFile ? "Selected file" : "No file selected"}
                  </h2>
                </div>
                <div className="flex h-11 w-11 items-center justify-center border border-[#111111] bg-white text-[#111111]">
                  <Sparkles className="h-5 w-5" />
                </div>
              </div>

              <AnimatePresence mode="wait">
                {previewFile ? (
                  <motion.div
                    key={previewFile.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="mt-5 space-y-5"
                  >
                    <div className="border border-[#111111] bg-white p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-[#d8241f] bg-[#f2f0ea] text-[#d8241f]">
                          {React.createElement(getFileIcon(previewFile.file_type), {
                            className: "h-5 w-5",
                          })}
                        </div>
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-lg font-extrabold leading-tight tracking-[-0.025em] text-[#111111]">
                            {previewFile.name}
                          </p>
                          <p className="industrial-meta mt-2 text-[#68655e]">
                            ID {previewFile.id.slice(0, 8)}
                          </p>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Badge
                              variant="outline"
                              className="border-[#111111] bg-white px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[#111111]"
                            >
                              {previewFile.category}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="border-[#c9c6bd] bg-white px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[#4f4c46]"
                            >
                              {previewFile.file_type ?? "FILE"}
                            </Badge>
                            {previewFile.is_starred ? (
                              <Badge
                                variant="outline"
                                className="border-[#d8241f] bg-[#d8241f] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-white"
                              >
                                Starred
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-y border-[#111111] sm:grid sm:grid-cols-2 sm:gap-x-5 2xl:block">
                      <DetailField label="Year" value={previewFile.year} />
                      <DetailField
                        label="Upload Date"
                        value={formatDate(previewFile.created_at)}
                      />
                      <DetailField
                        label="File Size"
                        value={formatFileSize(previewFile.file_size)}
                      />
                      <DetailField
                        label="Uploader"
                        value={previewFile.uploader?.trim() || "Unknown"}
                      />
                    </div>

                    <div className="border border-[#111111] bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="industrial-label text-[#68655e]">
                          Preview
                        </p>
                        {previewUrl ? (
                          <a
                            href={previewUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-[#d8241f] underline underline-offset-4"
                          >
                            Open separately
                          </a>
                        ) : null}
                      </div>

                      <div className="mt-3 overflow-hidden border border-[#c9c6bd] bg-[#f2f0ea]">
                        {isPreviewLoading ? (
                          <div className="flex h-[12rem] items-center justify-center text-sm text-[#68655e]">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading preview...
                          </div>
                        ) : previewError ? (
                          <div className="flex h-[12rem] items-center justify-center px-6 text-center text-sm text-[#b91f1b]">
                            {previewError}
                          </div>
                        ) : previewKind === "image" && previewUrl ? (
                          <div className="flex min-h-[12rem] items-center justify-center p-4">
                            <img
                              src={previewUrl}
                              alt={previewFile.name}
                            className="max-h-[14rem] w-auto max-w-full object-contain"
                            />
                          </div>
                        ) : previewKind === "pdf" && previewUrl ? (
                          <iframe
                            title={`${previewFile.name} preview`}
                            src={previewUrl}
                            className="h-[15rem] w-full bg-white"
                          />
                        ) : (
                          <div className="flex h-[12rem] items-center justify-center px-6 text-center text-sm text-[#68655e]">
                            Preview is available for PDF and image files only.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="border-l-2 border-[#d8241f] bg-white py-1 pl-4 pr-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="industrial-label text-[#d8241f]">
                          Generated Summary
                        </p>
                        {isSummaryLoading ? (
                          <div className="industrial-meta flex items-center gap-2 text-[#68655e]">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Generating
                          </div>
                        ) : null}
                      </div>
                      <p className="mt-3 text-sm leading-6 text-[#3f3d38]">
                        {previewFile.summary?.trim() ||
                          (isSummaryLoading
                            ? "Generating a summary from the file content..."
                            : "No summary is available for this file yet.")}
                      </p>
                      {summaryNotice ? (
                        <p className="industrial-meta mt-3 leading-5 text-[#68655e]">
                          {summaryNotice}
                        </p>
                      ) : null}
                    </div>

                    <div className="border-t border-[#111111] pt-4">
                      <p className="industrial-label text-[#68655e]">
                        Description
                      </p>
                      <p className="mt-3 text-sm leading-6 text-[#3f3d38]">
                        {previewFile.description?.trim() ||
                          "No description was saved for this file."}
                      </p>
                    </div>

                    <div className="border-t border-[#111111] pt-4">
                      <p className="industrial-label text-[#68655e]">
                        Storage Path
                      </p>
                      <p className="industrial-meta mt-3 break-all border border-[#c9c6bd] bg-white px-3 py-3 text-[#4f4c46]">
                        {buildStoragePathLabel(previewFile.file_path)}
                      </p>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-1">
                      <Button
                        type="button"
                        className="border border-[#d8241f] bg-[#d8241f] font-mono text-xs uppercase tracking-[0.06em] text-white hover:bg-[#b91f1b]"
                        onClick={() => void handleDownload(previewFile)}
                        disabled={downloadingFileId === previewFile.id}
                      >
                        {downloadingFileId === previewFile.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        Download original
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-[#111111] bg-white font-mono text-xs uppercase tracking-[0.06em]"
                        onClick={() => handleDownloadSummary(previewFile)}
                      >
                        <FileText className="h-4 w-4" />
                        Download summary
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-[#111111] bg-white font-mono text-xs uppercase tracking-[0.06em]"
                        onClick={() => {
                          setRenameTarget(previewFile);
                          setRenameName(previewFile.name);
                        }}
                      >
                        <PencilLine className="h-4 w-4" />
                        Rename file
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "border-[#111111] bg-white font-mono text-xs uppercase tracking-[0.06em]",
                          previewFile.is_starred && "border-[#d8241f] text-[#d8241f]",
                        )}
                        onClick={() => void handleToggleStar(previewFile)}
                      >
                        <Star
                          className={cn("h-4 w-4", previewFile.is_starred ? "fill-current" : "")}
                        />
                        {previewFile.is_starred ? "Remove star" : "Add star"}
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty-detail"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="mt-5"
                  >
                    <EmptyState
                      title="Choose a file"
                      description="Select any item from the browser to inspect its preview, summary, and metadata here."
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </aside>
        </div>
      </div>

      {user ? (
        <UploadDialog
          open={isUploadOpen}
          onOpenChange={setIsUploadOpen}
          userId={user.id}
          uploader={user.email ?? "Admin"}
          years={years}
          onUploaded={handleUploadComplete}
        />
      ) : null}

      <Dialog
        open={isYearDialogOpen}
        onOpenChange={(open) => {
          setIsYearDialogOpen(open);
          if (!open) {
            setPendingYear("");
          }
        }}
      >
        <DialogContent className="industrial-surface max-w-[calc(100%-1.25rem)] border border-[#111111] bg-[#f2f0ea] p-0 sm:max-w-md">
          <DialogHeader className="border-b border-[#111111] px-5 py-5">
            <DialogTitle className="text-2xl font-extrabold uppercase tracking-[-0.035em] text-[#111111]">
              Add year
            </DialogTitle>
            <DialogDescription className="text-sm text-[#68655e]">
              Create a new year option for filtering and future uploads.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-5 px-5 py-5" onSubmit={handleAddYearSubmit}>
            <div className="space-y-2">
              <label className="industrial-label text-[#4f4c46]" htmlFor="new-year">
                Year
              </label>
              <Input
                id="new-year"
                value={pendingYear}
                onChange={(event) =>
                  setPendingYear(event.target.value.replace(/[^\d]/g, "").slice(0, 4))
                }
                inputMode="numeric"
                maxLength={4}
                className="h-11 border-[#111111] bg-white font-mono"
                placeholder={String(new Date().getFullYear() + 1)}
              />
              <p className="industrial-meta text-[#68655e]">
                Added years will also appear in the upload form.
              </p>
            </div>

            <DialogFooter className="border-t border-[#111111] pt-4">
              <Button
                type="button"
                variant="outline"
                className="border-[#111111] bg-white font-mono text-xs uppercase tracking-[0.06em]"
                onClick={() => {
                  setIsYearDialogOpen(false);
                  setPendingYear("");
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="border border-[#d8241f] bg-[#d8241f] font-mono text-xs uppercase tracking-[0.06em] text-white hover:bg-[#b91f1b]"
              >
                Save year
              </Button>
            </DialogFooter>
          </form>
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
        <DialogContent className="industrial-surface max-w-[calc(100%-1.25rem)] border border-[#111111] bg-[#f2f0ea] p-0 sm:max-w-md">
          <DialogHeader className="border-b border-[#111111] px-5 py-5">
            <DialogTitle className="text-2xl font-extrabold uppercase tracking-[-0.035em] text-[#111111]">
              Rename file
            </DialogTitle>
            <DialogDescription className="text-sm text-[#68655e]">
              Update the file name shown in your storage workspace.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-5 px-5 py-5" onSubmit={handleRenameSubmit}>
            <div className="space-y-2">
              <label className="industrial-label text-[#4f4c46]" htmlFor="rename-file">
                File name
              </label>
              <Input
                id="rename-file"
                value={renameName}
                onChange={(event) => setRenameName(event.target.value)}
                className="h-11 border-[#111111] bg-white font-mono"
                placeholder="company-profile.pdf"
                disabled={isRenaming}
              />
            </div>

            <DialogFooter className="border-t border-[#111111] pt-4">
              <Button
                type="button"
                variant="outline"
                className="border-[#111111] bg-white font-mono text-xs uppercase tracking-[0.06em]"
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
                className="border border-[#d8241f] bg-[#d8241f] font-mono text-xs uppercase tracking-[0.06em] text-white hover:bg-[#b91f1b]"
                disabled={isRenaming}
              >
                {isRenaming ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isRenaming ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
