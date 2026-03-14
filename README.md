# Orca Monorepo

Welcome to the internal source code repository for Orca. This project is structured as a [Turborepo](https://turbo.build/) monorepo containing multiple applications and shared packages.

## Workspace Structure

### Apps
- `apps/desktop`: The core, private local desktop application built with Electron, React, and Vite  Orca.
- `apps/web`: The Next.js 16 App Router landing page with Stripe and Supabase integration.
- `apps/worker`: A Node.js background service that pulls news via Perplexity, summarizes it with GPT-4o-mini, and orchestrates jobs with BullMQ and node-cron.

### Packages
- `packages/db`: Shared database schemas and Supabase client definitions.
- `packages/ai`: Vercel AI SDK wrappers and prompts.
- `packages/config`: Shared application constants and types.

## Getting Started

### Prerequisites
- Node.js 20+
- npm (v11+)

### 1. Install Dependencies
Run from the root directory to install dependencies for all workspaces:
```bash
npm install
```

### 2. Environment Variables
Copy the `.env.example` file to `.env` in the root:
```bash
cp .env.example .env
```
Fill out the required API keys (Supabase, Stripe, OpenAI, Perplexity, etc.) to ensure all services function.

## Available Commands

Turborepo gives us the ability to run scripts across the entire monorepo simultaneously.

### Development
Start the dev servers for all apps in parallel:
```bash
npm run dev
```
> Running `npm run dev` in the root will start the Next.js dev server, compile background service TypeScript, and launch the Electron application locally.

### Building
Build all applications and packages in the correct dependency order:
```bash
npm run build
```

### Linting
Run linting across all supported packages and applications:
```bash
npm run lint
```

## Running Specific Applications

If you only want to work on a specific part of the codebase, you can pass a filter to Turborepo.

**Web Only:**
```bash
npx turbo run dev --filter=@newsflow/web
```

**Desktop App Only:**
```bash
npx turbo run dev --filter=@newsflow/desktop
```

**Background Worker Only:**
```bash
npx turbo run dev --filter=@newsflow/worker
```

*Note: As long as cross-package dependencies are met, Turborepo will automatically ensure local `@newsflow/*` packages are built if needed.*
