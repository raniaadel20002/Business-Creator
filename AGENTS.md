# BUSINESS CREATOR - AGENTS.md

Create a new `AGENTS.md` for Business Creator using the provided EGYPT DREAMS AGENTS.md as the exact template.

Follow its exact English writing style, section structure, heading hierarchy, numbering, formatting, directory tree presentation, and level of detail.

## 1. Project Architecture & Reference Directory Structure

Use the following approved architecture, adapted to the actual Business Creator project:

- Feature-based organization inside `src/features/`.
- UI primitives inside `src/components/ui/`.
- Reusable UI components inside `src/components/shared/`.
- Application entry and routing inside `src/app/`.
- Client-side services inside `src/services/`.
- Shared hooks inside `src/hooks/`.
- Types inside `src/types/`.
- Constants and utilities inside their existing directories.
- Backend responsibilities inside `server/`.
- Vercel serverless entry points inside `api/`.

Organize feature-specific components, hooks, services, and utilities inside their respective feature directories.

Do not introduce unnecessary architectural layers or duplicate existing responsibilities.

## 2. Critical Placement & Behavioral Rules

Write strict numbered placement and behavioral rules in the same style as EGYPT DREAMS.

Cover:
- Application and routing responsibilities.
- UI component placement.
- Feature-based business logic.
- Frontend and backend separation.
- API and serverless function responsibilities.
- Supabase client and admin access.
- AI services and sensitive credentials.
- Types, constants, hooks, and utilities.
- Code quality and maintainability.

## 3. Tech Stack Reference

Use the actual verified Business Creator technologies:

- React 19 + Vite 6
- TypeScript 5
- Express 5
- Supabase
- Google Gemini API
- Vercel Serverless Functions
- Resend
- Motion
- Chart.js
- React Markdown
- Lucide React
- npm

Do not introduce Next.js conventions or unnecessary dependencies.

## Strict Constraints

- Payment is manual through administrator communication or InstaPay.
- No Paymob, Stripe, or other payment gateways.
- No automatic payment processing or payment gateway webhooks.
- Preserve existing subscription management and administrative functionality where applicable.
- Never expose server-side secrets to the browser.
- Never invent APIs, database fields, or dummy data.
- Never remove existing functionality without verifying its dependencies.
- Never commit to main unless explicitly instructed.
- Never use browser-based validation.
- Never use emojis in code, comments, documentation, or responses.

Create ONLY `AGENTS.md`.

Do not modify application code, move files, delete files, install dependencies, or perform refactoring.