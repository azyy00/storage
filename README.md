# Goa Community College File Storage Portal

A branded file storage and review system for Goa Community College.  
This project lets authenticated users upload, organize, preview, summarize, download, rename, and delete files inside their own private workspace.

Production URL: `https://bot-storage.vercel.app`

## Overview

This system was built as a simple internal document portal with:

- account login and sign-up
- private file storage per user
- file previews for PDF and image files
- automatic document summaries
- responsive dashboard layout for mobile, tablet, and desktop
- Goa Community College branding and web identity

## Main Features

- Upload files into a private Supabase Storage bucket
- Rename, download, and delete stored files
- View file metadata in a clean dashboard
- Open a file popup with:
  - file preview
  - file info
  - saved summary
- Generate summaries automatically from file content
- Show responsive dashboard cards and analytics chart
- Support separate workspaces per signed-in user

## Tools And Stack

### Frontend

- `React 19`
- `TypeScript`
- `Vite 7`
- `React Router`
- `Tailwind CSS`
- `shadcn/ui` + `Radix UI`
- `Lucide React`
- `Sonner` for toast notifications

### Backend And Storage

- `Supabase Auth`
- `Supabase Postgres`
- `Supabase Storage`
- `Supabase Edge Functions`
- `Row Level Security (RLS)`

### Document Processing

- `pdfjs-dist` for PDF text extraction
- `mammoth` for DOCX text extraction

### AI Summary

- `OpenAI Responses API`
- Default summary model: `gpt-5-mini`
- AI call is made inside the Supabase Edge Function `generate-summary`
- Local fallback summary is used if AI is unavailable

### Deployment

- `Vercel`

## How The System Works

### Authentication

- Users create an account or log in with Supabase Auth.
- The app uses protected routes, so only signed-in users can access the dashboard.
- A primary admin email is defined in `src/lib/admin.ts`:
  - `goacommunitycollege@gmail.com`
- Other authenticated users can still sign in and use their own workspace.

### File Storage

- Files are stored in the private Supabase bucket:
  - `bot-files`
- Files are saved using this path structure:

```text
userId/year/category/fileName
```

- Download and preview access uses signed URLs.

### File Metadata

Each uploaded file creates a record in the `public.bot_files` table.

Important fields:

- `id`
- `user_id`
- `name`
- `file_path`
- `year`
- `category`
- `file_type`
- `file_size`
- `summary`
- `uploader`
- `created_at`
- `updated_at`

### Automatic Summary Flow

When a file is uploaded or opened:

1. The app tries to extract readable text from the file.
2. If text is available, it sends that text to the `generate-summary` Supabase Edge Function.
3. The Edge Function uses the OpenAI Responses API to generate a short summary.
4. If AI is unavailable, the app creates a local fallback summary.
5. The final summary is saved in `bot_files.summary`.

## Supported File Handling

### Preview Support

- `PDF`
- image files such as:
  - `png`
  - `jpg`
  - `jpeg`
  - `gif`
  - `webp`
  - `svg`
  - `bmp`
  - `avif`

### Summary Extraction Support

- `PDF` (text-based PDFs, up to the first 8 pages)
- `DOCX`
- plain text formats such as:
  - `txt`
  - `md`
  - `csv`
  - `json`
  - `xml`
  - `yml`
  - `yaml`
  - `log`
  - `html`
  - `htm`

### Summary Limits

- Maximum summarizable file size: `10 MB`
- Image-only or scanned PDFs may not produce strong summaries
- Unsupported file types fall back to a basic summary

## Project Structure

```text
src/
  components/
    auth/
    files/
    ui/
  hooks/
    useBotFiles.ts
  lib/
    admin.ts
    constants.ts
    env.ts
    file-utils.ts
    storage.ts
    summary.ts
    supabaseClient.ts
  pages/
    dashboard.tsx
    login-page.tsx
  providers/
    auth-provider.tsx
  types/

supabase/
  config.toml
  schema.sql
  policies.sql
  functions/
    generate-summary/
      index.ts
```

## Required Environment Variables

Create a local `.env` file with:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

For AI summaries, set this secret in Supabase Edge Functions:

```env
OPENAI_API_KEY=your_openai_api_key
```

Important:

- Do not commit `.env`
- `.gitignore` already excludes `.env`

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Add environment variables

Create `.env` using the variables above.

### 3. Configure Supabase

Apply these SQL files to your Supabase project:

- `supabase/schema.sql`
- `supabase/policies.sql`

### 4. Deploy the summary function

```bash
supabase functions deploy generate-summary
```

### 5. Add the OpenAI secret to Supabase

```bash
supabase secrets set OPENAI_API_KEY=your_openai_api_key
```

### 6. Start the app

```bash
npm run dev
```

## Available Scripts

- `npm run dev`  
  Starts the Vite development server

- `npm run build`  
  Creates a production build

- `npm run preview`  
  Serves the built app locally for preview

## Deployment Notes

### Vercel

This app is deployed on Vercel.

Required Vercel environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Routing is handled by `vercel.json` so client-side routes such as `/login` work on refresh.

### Supabase

Before production use, make sure these are live:

- `supabase/schema.sql`
- `supabase/policies.sql`
- `supabase/functions/generate-summary/index.ts`

The summary function is configured in `supabase/config.toml` with:

- `verify_jwt = true`

## Security Notes

- Supabase Storage bucket is private
- Access is controlled with signed URLs
- `bot_files` access is protected with RLS
- Storage object access is restricted per authenticated user folder
- The summary function requires JWT verification
- No Supabase service role key is exposed in the frontend

## Current System Identity

- School branding: `Goa Community College`
- Main logo file: `Logo.png`
- Public logo for web identity: `public/Logo.png`
- App title: `Goa Community College File Storage Portal`

## Recommended Maintenance Checklist

- Keep Vercel environment variables updated
- Keep Supabase policies applied after backend changes
- Redeploy the `generate-summary` function when summary logic changes
- Check file summaries on newly uploaded PDFs and DOCX files
- Watch Vercel and Supabase free-tier usage if traffic grows

## Notes

- The system is designed to stay simple and focused.
- File content is not edited inside the app.
- The dashboard currently emphasizes storage, summaries, and yearly archive activity.
