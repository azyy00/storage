"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  Bot,
  CalendarDays,
  ChevronRight,
  Clock3,
  Database,
  Download,
  FileCode2,
  FileUp,
  FileSpreadsheet,
  FileText,
  Files,
  FolderOpen,
  HardDrive,
  LayoutGrid,
  List,
  Plus,
  Search,
  Sparkles,
  Star,
  Upload,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

type FileItem = {
  id: string;
  name: string;
  year: string;
  category: string;
  size: string;
  uploadedAt: string;
  type: string;
  uploader: string;
  starred: boolean;
  summary: string;
  description: string;
  originalFile?: File | null;
  originalUrl?: string | null;
  mimeType?: string;
};

type SectionKey = "my-drive" | "recent" | "starred" | "archives";
type ViewMode = "grid" | "list";

const BASE_YEARS = ["2026", "2025", "2024", "2023"];
const BASE_CATEGORIES = [
  "Automation",
  "Training Data",
  "Deployment",
  "Prompt Library",
  "Reports",
  "Reference",
];

const INITIAL_FILES: FileItem[] = [
  {
    id: "BOT-2026-001",
    name: "Sales Automation Bot Spec.pdf",
    year: "2026",
    category: "Automation",
    size: "2.4 MB",
    uploadedAt: "2026-02-18T09:20:00.000Z",
    type: "PDF",
    uploader: "Mia Santos",
    starred: true,
    summary:
      "Defines the handoff flow, escalation thresholds, and lead qualification rules for the sales automation bot rollout.",
    description:
      "This specification covers the 2026 sales automation bot release, including qualification scoring, CRM sync rules, fallback routing, and approval checkpoints for high-value enterprise opportunities.",
  },
  {
    id: "BOT-2026-002",
    name: "Customer Support Bot Training Data.csv",
    year: "2026",
    category: "Training Data",
    size: "18.7 MB",
    uploadedAt: "2026-01-30T13:45:00.000Z",
    type: "CSV",
    uploader: "Paolo Reyes",
    starred: false,
    summary:
      "Curated support conversations labeled by intent, sentiment, and resolution path for service bot tuning.",
    description:
      "The dataset contains reviewed customer support transcripts with intent mapping, escalation labels, and channel-specific notes to improve the support bot's answer accuracy and deflection rate.",
  },
  {
    id: "BOT-2026-003",
    name: "Finance Bot Deployment Notes.docx",
    year: "2026",
    category: "Deployment",
    size: "1.1 MB",
    uploadedAt: "2026-03-05T07:10:00.000Z",
    type: "DOCX",
    uploader: "Ariane Cruz",
    starred: true,
    summary:
      "Documents environment variables, approval gates, and rollback instructions for the finance bot production push.",
    description:
      "Deployment notes for the finance bot production release, including secrets rotation, treasury data connector verification, staging sign-off, rollback instructions, and the post-deploy monitoring checklist.",
  },
  {
    id: "BOT-2025-014",
    name: "HR Onboarding Bot Prompt Library.json",
    year: "2025",
    category: "Prompt Library",
    size: "860 KB",
    uploadedAt: "2025-11-12T16:05:00.000Z",
    type: "JSON",
    uploader: "Janelle Dizon",
    starred: false,
    summary:
      "Structured prompt set for onboarding Q&A, policy explanations, and first-week workflow guidance.",
    description:
      "JSON prompt library used by the HR onboarding bot, with reusable prompt templates for policy education, checklist reminders, equipment requests, and personalized first-week guidance.",
  },
  {
    id: "BOT-2025-010",
    name: "Operations Incident Bot Weekly Report.pdf",
    year: "2025",
    category: "Reports",
    size: "3.8 MB",
    uploadedAt: "2025-08-22T10:30:00.000Z",
    type: "PDF",
    uploader: "Nico Velasco",
    starred: false,
    summary:
      "Summarizes bot-led incident triage volume, first-response timing, and queue trends across the week.",
    description:
      "Weekly performance report for the operations incident bot, highlighting triage counts, response latency, top failure categories, and staffing recommendations based on escalation patterns.",
  },
  {
    id: "BOT-2025-006",
    name: "Legal Review Assistant Reference Pack.pdf",
    year: "2025",
    category: "Reference",
    size: "4.2 MB",
    uploadedAt: "2025-06-17T04:55:00.000Z",
    type: "PDF",
    uploader: "Daphne Lim",
    starred: true,
    summary:
      "Reference material for clause extraction rules, legal taxonomy, and approved reviewer language.",
    description:
      "This reference pack supports the legal review assistant bot with policy excerpts, clause classification guidelines, tone guardrails, and examples of approved reviewer-ready outputs.",
  },
  {
    id: "BOT-2024-021",
    name: "Procurement Bot Supplier Intake Data.csv",
    year: "2024",
    category: "Training Data",
    size: "12.5 MB",
    uploadedAt: "2024-10-02T15:15:00.000Z",
    type: "CSV",
    uploader: "Rico Mendoza",
    starred: false,
    summary:
      "Supplier intake records used to tune the procurement bot for vendor onboarding and risk tagging.",
    description:
      "A cleaned supplier intake dataset with region tags, compliance flags, approval outcomes, and handoff labels used to improve procurement bot recommendations and routing logic.",
  },
  {
    id: "BOT-2024-016",
    name: "Marketing Bot Campaign Automation Blueprint.pdf",
    year: "2024",
    category: "Automation",
    size: "5.1 MB",
    uploadedAt: "2024-07-19T12:25:00.000Z",
    type: "PDF",
    uploader: "Elle Navarro",
    starred: false,
    summary:
      "Blueprint for campaign brief intake, asset generation routing, and approval notifications in the marketing bot.",
    description:
      "This blueprint outlines the marketing bot workflow from campaign brief intake through creative routing, approval messaging, and launch readiness checks across multiple campaign types.",
  },
  {
    id: "BOT-2024-009",
    name: "Security Bot Release Checklist.docx",
    year: "2024",
    category: "Deployment",
    size: "980 KB",
    uploadedAt: "2024-04-11T06:35:00.000Z",
    type: "DOCX",
    uploader: "Victor Ramos",
    starred: true,
    summary:
      "Release checklist for the security bot covering secrets, alert routing, and access review validation.",
    description:
      "Checklist used before promoting the security operations bot, including secrets validation, incident notification routing, alert channel smoke tests, and security reviewer sign-off.",
  },
  {
    id: "BOT-2023-028",
    name: "Knowledge Bot Source Reference Index.pdf",
    year: "2023",
    category: "Reference",
    size: "2.9 MB",
    uploadedAt: "2023-12-03T11:12:00.000Z",
    type: "PDF",
    uploader: "Sofia Martin",
    starred: false,
    summary:
      "Index of approved knowledge sources, update frequency, and ownership for the internal knowledge bot.",
    description:
      "Source reference index for the knowledge bot showing approved documentation sources, ownership, update cadence, and confidence notes used for retrieval filtering.",
  },
  {
    id: "BOT-2023-017",
    name: "Service Desk Bot Prompt Stack.json",
    year: "2023",
    category: "Prompt Library",
    size: "620 KB",
    uploadedAt: "2023-09-28T08:08:00.000Z",
    type: "JSON",
    uploader: "Liam Torres",
    starred: false,
    summary:
      "Prompt stack for issue triage, asset request handling, and user-facing troubleshooting guidance.",
    description:
      "Prompt collection for the service desk bot that includes troubleshooting patterns, persona framing, escalation triggers, and response formatting rules for different support channels.",
  },
  {
    id: "BOT-2023-011",
    name: "BOT Governance Readiness Report.pdf",
    year: "2023",
    category: "Reports",
    size: "3.1 MB",
    uploadedAt: "2023-05-20T14:42:00.000Z",
    type: "PDF",
    uploader: "Grace Ong",
    starred: true,
    summary:
      "Readiness report tracking governance controls, document coverage, and audit follow-ups across BOT initiatives.",
    description:
      "Cross-functional governance report summarizing documentation completeness, audit follow-ups, approval coverage, and readiness indicators for active BOT programs.",
  },
];

const SECTION_OPTIONS: Array<{
  key: SectionKey;
  label: string;
  icon: LucideIcon;
  description: string;
}> = [
  {
    key: "my-drive",
    label: "My Drive",
    icon: HardDrive,
    description: "All BOT working files",
  },
  {
    key: "recent",
    label: "Recent",
    icon: Clock3,
    description: "Latest file activity",
  },
  {
    key: "starred",
    label: "Starred",
    icon: Star,
    description: "Pinned essentials",
  },
  {
    key: "archives",
    label: "BOT Archives",
    icon: Archive,
    description: "Prior-year records",
  },
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

function detectType(name: string) {
  const extension = name.split(".").pop()?.trim().toUpperCase();
  return extension && extension !== name.toUpperCase() ? extension : "FILE";
}

function estimateSize(name: string, description: string) {
  const rawMb = 0.4 + name.length * 0.06 + description.length * 0.01;

  if (rawMb >= 1) {
    return `${rawMb.toFixed(1)} MB`;
  }

  return `${Math.round(rawMb * 1024)} KB`;
}

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }

  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (bytes >= 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${bytes} B`;
}

function buildPendingFileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function generateSummary(description: string, name: string, category: string) {
  const cleaned = description.replace(/\s+/g, " ").trim();

  if (!cleaned) {
    return `Generated overview for ${name}: ${category.toLowerCase()} BOT asset ready for storage and review.`;
  }

  const firstSentence = cleaned.split(/(?<=[.!?])\s+/)[0]?.trim() ?? cleaned;
  if (firstSentence.length >= 64) {
    return truncate(firstSentence, 150);
  }

  const words = cleaned.split(" ").slice(0, 22).join(" ");
  return truncate(words, 150);
}

function buildStoragePath(file: FileItem) {
  return `/bot-drive/${file.year}/${slugify(file.category)}/${slugify(file.name)}`;
}

function getFileIcon(type: string): LucideIcon {
  switch (type.toUpperCase()) {
    case "CSV":
    case "XLSX":
      return FileSpreadsheet;
    case "JSON":
    case "YAML":
    case "XML":
      return FileCode2;
    default:
      return FileText;
  }
}

function getCategoryTone(category: string) {
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

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost" | "outline" | "soft";
    size?: "default" | "sm" | "lg" | "icon";
  }
>(({ className, variant = "primary", size = "default", type = "button", ...props }, ref) => {
  const base =
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  const variants = {
    primary:
      "bg-slate-900 text-white shadow-sm hover:-translate-y-0.5 hover:bg-slate-800",
    secondary:
      "bg-sky-600 text-white shadow-sm hover:-translate-y-0.5 hover:bg-sky-500",
    ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
    outline:
      "border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700",
    soft: "bg-sky-50 text-sky-700 hover:bg-sky-100",
  };
  const sizes = {
    default: "h-11 px-4 py-2.5",
    sm: "h-9 rounded-xl px-3",
    lg: "h-12 px-5 text-sm",
    icon: "h-10 w-10 rounded-xl",
  };

  return (
    <button
      ref={ref}
      type={type}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
});

Button.displayName = "Button";

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-11 w-full rounded-2xl border border-slate-200 bg-white/90 px-4 text-sm text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100",
      className,
    )}
    {...props}
  />
));

Input.displayName = "Input";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100",
      className,
    )}
    {...props}
  />
));

Textarea.displayName = "Textarea";

function SelectField({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 w-full appearance-none rounded-2xl border border-slate-200 bg-white/90 px-4 text-sm text-slate-700 shadow-sm outline-none transition-all focus:border-sky-300 focus:ring-4 focus:ring-sky-100",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-[1.75rem] border border-slate-200/70 bg-white/90 shadow-xl shadow-slate-200/40 backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

function Badge({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.02em]",
        className,
      )}
    >
      {children}
    </span>
  );
}

function MetaBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-700">{value}</p>
    </div>
  );
}

function SidebarItem({
  active,
  label,
  description,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  label: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all",
        active
          ? "bg-sky-50 text-sky-700 ring-1 ring-sky-100"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
          active ? "bg-white text-sky-600 shadow-sm" : "bg-slate-100 text-slate-500",
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{label}</p>
        <p className="truncate text-xs text-slate-400">{description}</p>
      </div>
    </button>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            {value}
          </p>
          <p className="mt-2 text-sm text-slate-500">{hint}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

export default function BotDriveDashboard() {
  const [files, setFiles] = React.useState<FileItem[]>(INITIAL_FILES);
  const [section, setSection] = React.useState<SectionKey>("my-drive");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedYear, setSelectedYear] = React.useState("All Years");
  const [selectedCategory, setSelectedCategory] =
    React.useState("All Categories");
  const [viewMode, setViewMode] = React.useState<ViewMode>("grid");
  const [isDraggingFiles, setIsDraggingFiles] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(
    INITIAL_FILES[0]?.id ?? null,
  );
  const [form, setForm] = React.useState({
    year: BASE_YEARS[0],
    category: BASE_CATEGORIES[0],
    description: "",
    files: [] as File[],
  });

  const uploadPanelRef = React.useRef<HTMLDivElement | null>(null);
  const uploadInputRef = React.useRef<HTMLInputElement | null>(null);
  const uploadedObjectUrlsRef = React.useRef<string[]>([]);

  React.useEffect(() => {
    return () => {
      uploadedObjectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const years = Array.from(new Set([...BASE_YEARS, ...files.map((file) => file.year)])).sort(
    (a, b) => Number(b) - Number(a),
  );

  const categories = Array.from(
    new Set([...BASE_CATEGORIES, ...files.map((file) => file.category)]),
  ).sort((a, b) => {
    const aIndex = BASE_CATEGORIES.indexOf(a);
    const bIndex = BASE_CATEGORIES.indexOf(b);

    if (aIndex === -1 && bIndex === -1) {
      return a.localeCompare(b);
    }

    if (aIndex === -1) {
      return 1;
    }

    if (bIndex === -1) {
      return -1;
    }

    return aIndex - bIndex;
  });

  const maxYear = years.reduce((highest, currentYear) => {
    return Math.max(highest, Number(currentYear));
  }, 0);

  let sectionFiles = [...files].sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
  );

  if (section === "starred") {
    sectionFiles = sectionFiles.filter((file) => file.starred);
  }

  if (section === "archives") {
    sectionFiles = sectionFiles.filter((file) => Number(file.year) <= maxYear - 1);
  }

  if (section === "recent") {
    sectionFiles = sectionFiles.slice(0, 8);
  }

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredFiles = sectionFiles.filter((file) => {
    const matchesYear =
      selectedYear === "All Years" || file.year === selectedYear;
    const matchesCategory =
      selectedCategory === "All Categories" || file.category === selectedCategory;
    const matchesSearch =
      normalizedQuery.length === 0 ||
      [
        file.name,
        file.category,
        file.year,
        file.type,
        file.summary,
        file.description,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);

    return matchesYear && matchesCategory && matchesSearch;
  });

  React.useEffect(() => {
    if (!filteredFiles.some((file) => file.id === selectedId)) {
      setSelectedId(filteredFiles[0]?.id ?? null);
    }
  }, [filteredFiles, selectedId]);

  const selectedFile = files.find((file) => file.id === selectedId) ?? null;
  const previewSubject =
    form.files.length > 1
      ? `${form.files.length} BOT files`
      : form.files[0]?.name ?? "Uploaded BOT file";
  const previewSummary = generateSummary(
    form.description,
    previewSubject,
    form.category,
  );
  const visibleCount = filteredFiles.length;
  const totalYears = new Set(files.map((file) => file.year)).size;
  const totalCategories = new Set(files.map((file) => file.category)).size;

  function toggleStar(id: string) {
    setFiles((currentFiles) =>
      currentFiles.map((file) =>
        file.id === id ? { ...file, starred: !file.starred } : file,
      ),
    );
  }

  function resetFilters() {
    setSection("my-drive");
    setSelectedYear("All Years");
    setSelectedCategory("All Categories");
    setSearchQuery("");
  }

  function jumpToUpload() {
    uploadPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => uploadInputRef.current?.click(), 180);
  }

  function appendSelectedFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) {
      return;
    }

    const incomingFiles = Array.from(fileList);

    setForm((currentForm) => {
      const existingKeys = new Set(
        currentForm.files.map((file) => buildPendingFileKey(file)),
      );
      const dedupedIncomingFiles = incomingFiles.filter((file) => {
        const key = buildPendingFileKey(file);
        if (existingKeys.has(key)) {
          return false;
        }

        existingKeys.add(key);
        return true;
      });

      return {
        ...currentForm,
        files: [...currentForm.files, ...dedupedIncomingFiles],
      };
    });

    if (uploadInputRef.current) {
      uploadInputRef.current.value = "";
    }
  }

  function removePendingFile(fileToRemove: File) {
    const targetKey = buildPendingFileKey(fileToRemove);

    setForm((currentForm) => ({
      ...currentForm,
      files: currentForm.files.filter(
        (file) => buildPendingFileKey(file) !== targetKey,
      ),
    }));
  }

  function handleDownloadSummary(file: FileItem) {
    const payload = [
      `File name: ${file.name}`,
      `File ID: ${file.id}`,
      `Year: ${file.year}`,
      `Category: ${file.category}`,
      `Upload date: ${formatDate(file.uploadedAt)}`,
      `Type: ${file.type}`,
      `Uploader: ${file.uploader}`,
      `Summary: ${file.summary}`,
      "",
      "Description:",
      file.description,
    ].join("\n");

    const blob = new Blob([payload], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slugify(file.name.replace(/\.[^/.]+$/, "") || file.name)}-summary.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handleDownloadOriginal(file: FileItem) {
    if (!file.originalUrl) {
      return;
    }

    const link = document.createElement("a");
    link.href = file.originalUrl;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handleAddFile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (form.files.length === 0) {
      uploadInputRef.current?.click();
      return;
    }

    const timestamp = Date.now();
    const newFiles = form.files.map((rawFile, index) => {
      const fileDescription =
        form.description.trim() ||
        `${rawFile.name} was uploaded as a ${form.category.toLowerCase()} BOT file and is ready for team review.`;
      const objectUrl = URL.createObjectURL(rawFile);
      uploadedObjectUrlsRef.current.push(objectUrl);

      return {
        id: `BOT-${form.year}-${String(timestamp).slice(-6)}-${index + 1}`,
        name: rawFile.name,
        year: form.year,
        category: form.category,
        size: formatFileSize(rawFile.size),
        uploadedAt: new Date().toISOString(),
        type: detectType(rawFile.name),
        uploader: "You",
        starred: false,
        summary: generateSummary(fileDescription, rawFile.name, form.category),
        description: fileDescription,
        originalFile: rawFile,
        originalUrl: objectUrl,
        mimeType: rawFile.type,
      } satisfies FileItem;
    });

    setFiles((currentFiles) => [...newFiles, ...currentFiles]);
    setSelectedId(newFiles[0]?.id ?? null);
    setSection("my-drive");
    setSelectedYear("All Years");
    setSelectedCategory("All Categories");
    setSearchQuery("");
    setViewMode("grid");
    setForm((currentForm) => ({
      year: currentForm.year,
      category: currentForm.category,
      description: "",
      files: [],
    }));

    if (uploadInputRef.current) {
      uploadInputRef.current.value = "";
    }
  }

  return (
    <div
      className="min-h-screen bg-slate-50 px-4 py-5 text-slate-900 sm:px-6 sm:py-6 lg:px-8 lg:py-8"
      style={{
        backgroundImage:
          "radial-gradient(circle at top left, rgba(96, 165, 250, 0.16), transparent 30%), linear-gradient(180deg, #fbfdff 0%, #f4f7fb 100%)",
      }}
    >
      <div className="mx-auto max-w-[1800px]">
        <div className="grid gap-6 xl:grid-cols-[270px_minmax(0,1fr)_380px]">
          <motion.aside
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="xl:sticky xl:top-8 xl:self-start"
          >
            <Card className="overflow-hidden p-5">
              <div className="flex items-center gap-4 rounded-[1.5rem] bg-slate-950 px-4 py-4 text-white">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-lg font-semibold tracking-tight">BOT Drive</p>
                  <p className="text-sm text-slate-300">
                    Internal storage workspace
                  </p>
                </div>
              </div>

              <Button
                variant="secondary"
                size="lg"
                className="mt-5 w-full justify-center rounded-[1.35rem]"
                onClick={jumpToUpload}
              >
                <Plus className="h-4 w-4" />
                New Upload
              </Button>

              <div className="mt-6 space-y-1.5">
                {SECTION_OPTIONS.map((item) => (
                  <SidebarItem
                    key={item.key}
                    active={section === item.key}
                    label={item.label}
                    description={item.description}
                    icon={item.icon}
                    onClick={() => setSection(item.key)}
                  />
                ))}
              </div>

              <div className="mt-7 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Year folders
                    </p>
                    <p className="text-xs text-slate-500">
                      Filter BOT files by archive year
                    </p>
                  </div>
                  <FolderOpen className="h-4 w-4 text-slate-400" />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-2">
                  {years.map((year) => (
                    <button
                      key={year}
                      type="button"
                      onClick={() => setSelectedYear(year)}
                      className={cn(
                        "rounded-2xl border px-3 py-3 text-sm font-medium transition-all",
                        selectedYear === year
                          ? "border-sky-200 bg-white text-sky-700 shadow-sm"
                          : "border-transparent bg-white text-slate-600 hover:border-slate-200 hover:text-slate-900",
                      )}
                    >
                      {year}
                    </button>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  className="mt-3 w-full justify-between rounded-2xl px-3"
                  onClick={() => setSelectedYear("All Years")}
                >
                  All years
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-7 rounded-[1.5rem] bg-sky-50 p-4 text-sky-900">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-sky-600 shadow-sm">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">
                      Summaries stay ready
                    </p>
                    <p className="mt-1 text-sm text-sky-800/80">
                      Each BOT file keeps a generated synopsis so teams can scan
                      context before downloading the full asset.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.aside>

          <main className="min-w-0 space-y-6">
            <motion.header
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" }}
            >
              <Card className="p-5 sm:p-6">
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-400">
                        BOT file storage
                      </p>
                      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-[2.1rem]">
                        BOT Files
                      </h1>
                      <p className="mt-2 max-w-2xl text-sm text-slate-500">
                        Search, organize, and review BOT assets by year, category,
                        and generated context without leaving the workspace.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 self-start rounded-full border border-slate-200 bg-slate-50 px-2 py-2">
                      <Button
                        variant={viewMode === "grid" ? "secondary" : "ghost"}
                        size="sm"
                        aria-pressed={viewMode === "grid"}
                        onClick={() => setViewMode("grid")}
                        className={cn(
                          "rounded-full",
                          viewMode !== "grid" && "text-slate-500",
                        )}
                      >
                        <LayoutGrid className="h-4 w-4" />
                        Grid
                      </Button>
                      <Button
                        variant={viewMode === "list" ? "secondary" : "ghost"}
                        size="sm"
                        aria-pressed={viewMode === "list"}
                        onClick={() => setViewMode("list")}
                        className={cn(
                          "rounded-full",
                          viewMode !== "list" && "text-slate-500",
                        )}
                      >
                        <List className="h-4 w-4" />
                        List
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_200px_auto]">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <Input
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Search by name, year, category, type, summary, or description"
                        className="h-14 rounded-full border-slate-200 bg-slate-50 pl-12 pr-5 shadow-none"
                        aria-label="Search BOT files"
                      />
                    </div>

                    <SelectField
                      aria-label="Filter by year"
                      value={selectedYear}
                      onChange={(event) => setSelectedYear(event.target.value)}
                      className="h-14 rounded-full bg-slate-50"
                    >
                      <option>All Years</option>
                      {years.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </SelectField>

                    <SelectField
                      aria-label="Filter by category"
                      value={selectedCategory}
                      onChange={(event) => setSelectedCategory(event.target.value)}
                      className="h-14 rounded-full bg-slate-50"
                    >
                      <option>All Categories</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </SelectField>

                    <div className="flex items-center justify-between rounded-full border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-50 text-sky-700">
                          <span className="text-sm font-semibold">BT</span>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            BOT Admin
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            Internal operator
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.header>

            <section className="grid gap-4 md:grid-cols-3">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.08 }}
              >
                <StatCard
                  icon={Files}
                  label="Total files"
                  value={String(files.length)}
                  hint={`${visibleCount} visible in the current view`}
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.12 }}
              >
                <StatCard
                  icon={FolderOpen}
                  label="Total years"
                  value={String(totalYears)}
                  hint={`Spanning ${years[years.length - 1]} to ${years[0]}`}
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.16 }}
              >
                <StatCard
                  icon={Database}
                  label="Total categories"
                  value={String(totalCategories)}
                  hint="Operational, training, deployment, and reference files"
                />
              </motion.div>
            </section>

            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.18 }}
            >
              <Card className="overflow-hidden">
                <div className="border-b border-slate-200/80 px-5 py-5 sm:px-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">
                        File browser
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {visibleCount} {visibleCount === 1 ? "file" : "files"} in{" "}
                        {
                          SECTION_OPTIONS.find((option) => option.key === section)
                            ?.label
                        }
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge className="border-slate-200 bg-slate-50 text-slate-600">
                        <Search className="h-3 w-3" />
                        {searchQuery.trim() ? truncate(searchQuery, 22) : "No search"}
                      </Badge>
                      <Badge className="border-slate-200 bg-slate-50 text-slate-600">
                        {selectedYear}
                      </Badge>
                      <Badge className="border-slate-200 bg-slate-50 text-slate-600">
                        {selectedCategory}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full px-3 text-slate-500"
                        onClick={resetFilters}
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  {visibleCount === 0 ? (
                    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-slate-500 shadow-sm">
                        <Search className="h-6 w-6" />
                      </div>
                      <h3 className="mt-5 text-xl font-semibold text-slate-900">
                        No files match these filters
                      </h3>
                      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                        Broaden your search, switch sections, or clear the active
                        filters to bring BOT files back into view.
                      </p>
                      <Button
                        variant="secondary"
                        className="mt-5"
                        onClick={resetFilters}
                      >
                        <Plus className="h-4 w-4" />
                        Clear filters
                      </Button>
                    </div>
                  ) : viewMode === "grid" ? (
                    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                      {filteredFiles.map((file, index) => {
                        const Icon = getFileIcon(file.type);
                        const isSelected = file.id === selectedId;
                        const tone = getCategoryTone(file.category);

                        return (
                          <motion.button
                            key={file.id}
                            type="button"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              duration: 0.25,
                              delay: Math.min(index * 0.03, 0.18),
                            }}
                            whileHover={{ y: -2 }}
                            onClick={() => setSelectedId(file.id)}
                            className={cn(
                              "group rounded-[1.6rem] border p-5 text-left transition-all",
                              isSelected
                                ? "border-sky-200 bg-sky-50/80 shadow-lg shadow-sky-100/80"
                                : "border-slate-200 bg-white hover:bg-slate-50",
                            )}
                          >
                            <div className="flex items-start gap-4">
                              <div
                                className={cn(
                                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border",
                                  tone,
                                )}
                              >
                                <Icon className="h-5 w-5" />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="truncate text-base font-semibold text-slate-900">
                                      {file.name}
                                    </p>
                                    <p className="mt-1 truncate text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                                      {file.id}
                                    </p>
                                  </div>

                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                      "h-9 w-9 shrink-0 rounded-full",
                                      file.starred && "text-amber-500",
                                    )}
                                    aria-label={
                                      file.starred
                                        ? "Remove star from file"
                                        : "Star file"
                                    }
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      toggleStar(file.id);
                                    }}
                                  >
                                    <Star
                                      className={cn(
                                        "h-4 w-4",
                                        file.starred && "fill-current",
                                      )}
                                    />
                                  </Button>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                  <Badge className={tone}>{file.category}</Badge>
                                  <Badge className="border-slate-200 bg-slate-50 text-slate-600">
                                    {file.year}
                                  </Badge>
                                  <Badge className="border-slate-200 bg-slate-50 text-slate-600">
                                    {file.type}
                                  </Badge>
                                </div>

                                <p className="mt-4 text-sm leading-6 text-slate-600">
                                  {truncate(file.summary, 140)}
                                </p>

                                <div className="mt-5 flex items-center justify-between gap-3 text-xs text-slate-500">
                                  <span>{formatDate(file.uploadedAt)}</span>
                                  <span>{file.size}</span>
                                </div>
                              </div>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50">
                      <div className="hidden grid-cols-[minmax(0,2.2fr)_0.8fr_1fr_1fr_0.9fr_0.9fr] gap-4 border-b border-slate-200 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 lg:grid">
                        <span>File</span>
                        <span>Year</span>
                        <span>Category</span>
                        <span>Updated</span>
                        <span>Size</span>
                        <span>Uploader</span>
                      </div>

                      <div className="space-y-2 p-2">
                        {filteredFiles.map((file, index) => {
                          const Icon = getFileIcon(file.type);
                          const isSelected = file.id === selectedId;
                          const tone = getCategoryTone(file.category);

                          return (
                            <motion.button
                              key={file.id}
                              type="button"
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                duration: 0.22,
                                delay: Math.min(index * 0.02, 0.16),
                              }}
                              onClick={() => setSelectedId(file.id)}
                              className={cn(
                                "grid w-full gap-3 rounded-[1.3rem] border border-transparent bg-white px-4 py-4 text-left transition-all lg:grid-cols-[minmax(0,2.2fr)_0.8fr_1fr_1fr_0.9fr_0.9fr] lg:items-center",
                                isSelected
                                  ? "border-sky-200 bg-sky-50 shadow-sm"
                                  : "hover:border-slate-200 hover:bg-slate-100/70",
                              )}
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <div
                                  className={cn(
                                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border",
                                    tone,
                                  )}
                                >
                                  <Icon className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="truncate text-sm font-semibold text-slate-900">
                                      {file.name}
                                    </p>
                                    {file.starred ? (
                                      <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
                                    ) : null}
                                  </div>
                                  <p className="truncate text-xs text-slate-500">
                                    {file.id} | {file.type}
                                  </p>
                                </div>
                              </div>

                              <p className="text-sm text-slate-600">{file.year}</p>
                              <div className="text-sm">
                                <Badge className={tone}>{file.category}</Badge>
                              </div>
                              <p className="text-sm text-slate-600">
                                {formatDate(file.uploadedAt)}
                              </p>
                              <p className="text-sm text-slate-600">{file.size}</p>
                              <p className="truncate text-sm text-slate-600">
                                {file.uploader}
                              </p>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </motion.section>
          </main>

          <aside className="space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedFile?.id ?? "empty-detail"}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
              >
                <Card className="overflow-hidden p-5 sm:p-6">
                  {selectedFile ? (
                    <>
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            "flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl border",
                            getCategoryTone(selectedFile.category),
                          )}
                        >
                          {React.createElement(getFileIcon(selectedFile.type), {
                            className: "h-6 w-6",
                          })}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-xl font-semibold tracking-tight text-slate-950">
                                {selectedFile.name}
                              </p>
                              <p className="mt-1 truncate text-sm text-slate-500">
                                {selectedFile.id}
                              </p>
                            </div>

                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                "rounded-full",
                                selectedFile.starred && "text-amber-500",
                              )}
                              aria-label={
                                selectedFile.starred
                                  ? "Remove star from file"
                                  : "Star file"
                              }
                              onClick={() => toggleStar(selectedFile.id)}
                            >
                              <Star
                                className={cn(
                                  "h-4 w-4",
                                  selectedFile.starred && "fill-current",
                                )}
                              />
                            </Button>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <Badge className={getCategoryTone(selectedFile.category)}>
                              {selectedFile.category}
                            </Badge>
                            <Badge className="border-slate-200 bg-slate-50 text-slate-600">
                              {selectedFile.year}
                            </Badge>
                            <Badge className="border-slate-200 bg-slate-50 text-slate-600">
                              {selectedFile.type}
                            </Badge>
                            {selectedFile.originalUrl ? (
                              <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
                                Live upload
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        <MetaBlock label="Year" value={selectedFile.year} />
                        <MetaBlock label="Category" value={selectedFile.category} />
                        <MetaBlock label="Type" value={selectedFile.type} />
                        <MetaBlock
                          label="Upload date"
                          value={formatDate(selectedFile.uploadedAt)}
                        />
                        <MetaBlock label="Size" value={selectedFile.size} />
                        <MetaBlock label="Uploader" value={selectedFile.uploader} />
                      </div>

                      <div className="mt-6 rounded-[1.5rem] border border-sky-100 bg-sky-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-sky-600" />
                            <p className="text-sm font-semibold text-sky-900">
                              Generated summary
                            </p>
                          </div>
                          <Badge className="border-sky-200 bg-white text-sky-700">
                            Generated
                          </Badge>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-sky-950/80">
                          {selectedFile.summary}
                        </p>
                        <Button
                          variant="secondary"
                          className="mt-4 w-full justify-center"
                          onClick={() => handleDownloadSummary(selectedFile)}
                        >
                          <Download className="h-4 w-4" />
                          Download summary
                        </Button>
                        {selectedFile.originalUrl ? (
                          <Button
                            variant="outline"
                            className="mt-3 w-full justify-center"
                            onClick={() => handleDownloadOriginal(selectedFile)}
                          >
                            <FileUp className="h-4 w-4" />
                            Download original file
                          </Button>
                        ) : null}
                      </div>

                      <div className="mt-6">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-500" />
                          <p className="text-sm font-semibold text-slate-900">
                            Full description
                          </p>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-slate-600">
                          {selectedFile.description}
                        </p>
                      </div>

                      <div className="mt-6">
                        <div className="flex items-center gap-2">
                          <FolderOpen className="h-4 w-4 text-slate-500" />
                          <p className="text-sm font-semibold text-slate-900">
                            Storage path
                          </p>
                        </div>
                        <div className="mt-3 rounded-2xl bg-slate-950 px-4 py-3 font-mono text-xs leading-6 text-slate-100">
                          {buildStoragePath(selectedFile)}
                        </div>
                      </div>

                      <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                            <CalendarDays className="h-3.5 w-3.5" />
                            Uploaded
                          </div>
                          <p className="mt-2 text-sm text-slate-700">
                            {formatDate(selectedFile.uploadedAt)}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                            <Users className="h-3.5 w-3.5" />
                            Owner
                          </div>
                          <p className="mt-2 text-sm text-slate-700">
                            {selectedFile.uploader}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
                        <Files className="h-6 w-6" />
                      </div>
                      <h3 className="mt-5 text-lg font-semibold text-slate-900">
                        Select a BOT file
                      </h3>
                      <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
                        Choose a file from the browser to review its generated
                        summary, metadata, and storage details.
                      </p>
                    </div>
                  )}
                </Card>
              </motion.div>
            </AnimatePresence>

            <motion.div
              ref={uploadPanelRef}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, delay: 0.08, ease: "easeOut" }}
            >
              <Card className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-slate-950">
                      Quick upload
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Upload real BOT files from your device and generate summaries instantly.
                    </p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                    <Upload className="h-5 w-5" />
                  </div>
                </div>

                <form className="mt-6 space-y-4" onSubmit={handleAddFile}>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="bot-file-picker"
                        className="text-sm font-medium text-slate-700"
                      >
                        Files
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="rounded-full px-3"
                        onClick={() => uploadInputRef.current?.click()}
                      >
                        Browse
                      </Button>
                    </div>
                    <input
                      id="bot-file-picker"
                      ref={uploadInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(event) => appendSelectedFiles(event.target.files)}
                    />
                    <button
                      type="button"
                      onClick={() => uploadInputRef.current?.click()}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setIsDraggingFiles(true);
                      }}
                      onDragLeave={(event) => {
                        event.preventDefault();
                        setIsDraggingFiles(false);
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        setIsDraggingFiles(false);
                        appendSelectedFiles(event.dataTransfer.files);
                      }}
                      className={cn(
                        "flex w-full flex-col items-center justify-center rounded-[1.5rem] border border-dashed px-5 py-8 text-center transition-all",
                        isDraggingFiles
                          ? "border-sky-300 bg-sky-50"
                          : "border-slate-300 bg-slate-50 hover:border-sky-200 hover:bg-sky-50/60",
                      )}
                    >
                      <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white text-sky-600 shadow-sm">
                        <FileUp className="h-6 w-6" />
                      </div>
                      <p className="mt-4 text-sm font-semibold text-slate-900">
                        Drop files here or choose from your device
                      </p>
                      <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
                        Add one or more BOT documents, datasets, notes, or prompt libraries in a single upload batch.
                      </p>
                    </button>

                    <div className="space-y-2">
                      {form.files.length > 0 ? (
                        form.files.map((file) => (
                          <div
                            key={buildPendingFileKey(file)}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900">
                                {file.name}
                              </p>
                              <p className="truncate text-xs text-slate-500">
                                {formatFileSize(file.size)} | {detectType(file.name)}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full"
                              onClick={() => removePendingFile(file)}
                              aria-label={`Remove ${file.name}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                          No files selected yet.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label
                        htmlFor="bot-file-year"
                        className="text-sm font-medium text-slate-700"
                      >
                        Year
                      </label>
                      <SelectField
                        id="bot-file-year"
                        value={form.year}
                        onChange={(event) =>
                          setForm((currentForm) => ({
                            ...currentForm,
                            year: event.target.value,
                          }))
                        }
                      >
                        {years.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </SelectField>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="bot-file-category"
                        className="text-sm font-medium text-slate-700"
                      >
                        Category
                      </label>
                      <SelectField
                        id="bot-file-category"
                        value={form.category}
                        onChange={(event) =>
                          setForm((currentForm) => ({
                            ...currentForm,
                            category: event.target.value,
                          }))
                        }
                      >
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </SelectField>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="bot-file-description"
                      className="text-sm font-medium text-slate-700"
                    >
                      Description
                    </label>
                    <Textarea
                      id="bot-file-description"
                      value={form.description}
                      onChange={(event) =>
                        setForm((currentForm) => ({
                          ...currentForm,
                          description: event.target.value,
                        }))
                      }
                      placeholder="Describe what this BOT file is for, who uses it, and what decisions it supports."
                    />
                  </div>

                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-sky-600" />
                      <p className="text-sm font-semibold text-slate-900">
                        Generated preview
                      </p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {previewSummary}
                    </p>
                  </div>

                  <Button
                    type="submit"
                    variant="secondary"
                    size="lg"
                    className="w-full justify-center"
                  >
                    <Plus className="h-4 w-4" />
                    Upload {form.files.length > 1 ? `${form.files.length} files` : "file"}
                  </Button>
                </form>
              </Card>
            </motion.div>
          </aside>
        </div>
      </div>
    </div>
  );
}

