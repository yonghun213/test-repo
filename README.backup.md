# Store Launch Ops Platform

A collaborative, multi-country store launch operations platform for teams that open new stores across Latin America while being based in Canada.

## Features (MVP)

- **Store Management**: End-to-end store launch workflow with reusable templates
- **Task Scheduling**: D-day based timeline with dependencies and alerts
- **File Management**: Document upload/download for contracts and permits
- **Pricing Module**: Country-based ingredient pricing and menu costing
- **Multi-user Collaboration**: Role-based access control (Admin/PM/Contributor/Viewer)
- **Audit Trail**: Complete change history for accountability

## Tech Stack

- **Framework**: Next.js 14+ (App Router, TypeScript)
- **Database**: Prisma + SQLite (Postgres compatible)
- **Auth**: NextAuth.js (Credentials provider)
- **UI**: Tailwind CSS + shadcn/ui
- **Calendar**: react-big-calendar
- **Testing**: Playwright + Vitest

## Getting Started

```bash
# Install dependencies
npm install

# Setup database
npx prisma migrate dev
npx prisma db seed

# Run development server
npm run dev
```

## License

MIT