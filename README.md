# Store Launch Ops Platform

A collaborative, multi-country store launch operations platform for BBQ Chicken franchise teams that open new stores across Latin America while being based in Canada.

## Features (MVP)

### ✅ Implemented
- **Authentication & Authorization**: Role-based access control (Admin/PM/Contributor/Viewer)
- **Store Management**: Full CRUD operations with card-based UI
- **Planned Open Date Tracking**: Historical tracking of date changes with reasons
- **File Management**: Document upload/download with type and size validation
- **Dashboard**: KPI metrics and recent store overview
- **Filters & Search**: Country, status, and text-based search
- **Responsive Design**: Mobile-friendly interface
- **Audit Trail**: Automatic logging of all changes

### 🚧 Planned
- **Task Scheduling**: D-day based timeline with dependencies
- **Calendar View**: Visual timeline with react-big-calendar
- **Pricing Module**: Country-based ingredient pricing and menu costing
- **Template Management**: Reusable task templates
- **Notifications**: Email and in-app notifications

## Tech Stack

- **Framework**: Next.js 16.1 (App Router, TypeScript, Turbopack)
- **Database**: Prisma v5 + SQLite (Postgres compatible schema)
- **Auth**: NextAuth.js v4 (Credentials provider with bcrypt)
- **UI**: Tailwind CSS v3 + Custom components
- **Icons**: Lucide React
- **Notifications**: react-hot-toast
- **Testing**: Playwright + Vitest (planned)

## Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd test-repo
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

**Important**: Generate a secure `NEXTAUTH_SECRET` for production:
```bash
openssl rand -base64 32
```

### 4. Initialize the database

```bash
# Run migrations
npx prisma migrate dev

# Seed the database with sample data
npx prisma db seed
```

This will create:
- 3 countries (Mexico, Colombia, Canada)
- 5 users with different roles
- 2 sample stores
- 1 template with 21 tasks
- 25 ingredients, 12 recipes, and competitor pricing data

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Build for production

```bash
npm run build
npm run start
```

## Demo Accounts

After seeding the database, you can log in with these accounts:

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| Admin | admin@example.com | password123 | Full access |
| PM | pm@example.com | password123 | Create/edit stores |
| Contributor | contributor1@example.com | password123 | Edit stores |
| Contributor | contributor2@example.com | password123 | Edit stores |
| Viewer | viewer@example.com | password123 | Read-only |

## Project Structure

```
test-repo/
├── app/                          # Next.js App Router pages
│   ├── api/                      # API routes
│   │   ├── auth/                 # NextAuth.js configuration
│   │   └── stores/               # Store CRUD endpoints
│   ├── dashboard/                # Protected dashboard routes
│   │   ├── stores/               # Store management
│   │   ├── templates/            # Template management (planned)
│   │   ├── pricing/              # Pricing module (planned)
│   │   └── admin/                # Admin panel (planned)
│   ├── login/                    # Login page
│   ├── layout.tsx                # Root layout with providers
│   └── page.tsx                  # Home page (redirects)
├── components/                   # React components
│   ├── ui/                       # Reusable UI components
│   ├── FileManager.tsx           # File upload/download component
│   ├── StoreCard.tsx             # Store card component
│   ├── StoreForm.tsx             # Store create/edit form
│   └── ...
├── lib/                          # Utility functions
│   ├── auth.ts                   # NextAuth configuration
│   ├── prisma.ts                 # Prisma client
│   └── utils.ts                  # Helper functions
├── prisma/                       # Database
│   ├── schema.prisma             # Database schema
│   ├── seed.js                   # Seed script
│   └── migrations/               # Migration history
└── public/                       # Static files
    └── uploads/                  # Uploaded files (gitignored)
```

## Key Features Explained

### Store Management

- **Card-based UI**: Stores are displayed as collapsible cards showing key information
- **Official name priority**: Display shows `officialName` if available, otherwise `tempName`
- **Latest open date**: Automatically shows the most recent planned opening date
- **Historical tracking**: All open date changes are saved with reasons

### File Management

- **Supported formats**: PDF, Images (JPEG, PNG, GIF), Word (DOC, DOCX), Excel (XLS, XLSX)
- **Size limit**: 10MB per file
- **Local storage**: Files are saved to `public/uploads/stores/{storeId}/`
- **Database tracking**: Metadata stored in SQLite

### Role-Based Access Control

- **Admin**: Full access to all features
- **PM (Project Manager)**: Can create and edit stores
- **Contributor**: Can edit existing stores
- **Viewer**: Read-only access

### Audit Logging

All important actions are logged to the `AuditLog` table:
- Store creation/updates
- File uploads
- Open date changes

## Database Schema

The platform uses a comprehensive schema with 20+ models including:

- **User & Auth**: User accounts with role-based permissions
- **Countries**: Multi-country support with timezone/currency
- **Stores**: Store information and lifecycle
- **PlannedOpenDate**: Historical tracking of opening dates
- **Tasks & Templates**: Scheduled tasks and reusable templates
- **Files**: Document management
- **Pricing**: Ingredients, recipes, competitor prices, FX rates
- **AuditLog**: Complete change history

View the full schema in `prisma/schema.prisma`.

## Development

### Available Scripts

```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run Vitest unit tests (when implemented)
npm run test:e2e     # Run Playwright E2E tests (when implemented)
```

### Database Commands

```bash
npx prisma studio              # Open Prisma Studio (visual database editor)
npx prisma migrate dev         # Create and apply migrations
npx prisma db seed             # Re-seed the database
npx prisma generate            # Regenerate Prisma Client
npx prisma db push             # Push schema changes without migration
```

### Resetting the Database

```bash
rm -f prisma/dev.db
npx prisma migrate dev
npx prisma db seed
```

## Deployment

### Environment Variables

Ensure these are set in your production environment:

- `DATABASE_URL`: Your production database URL
- `NEXTAUTH_SECRET`: Secure random string (use `openssl rand -base64 32`)
- `NEXTAUTH_URL`: Your production domain URL

### Build & Deploy

```bash
npm run build
npm run start
```

The application can be deployed to:
- Vercel (recommended for Next.js)
- Railway
- Render
- Any Node.js hosting platform

**Note**: For production, consider migrating from SQLite to PostgreSQL.

## Troubleshooting

### Build errors

If you encounter build errors, try:
```bash
rm -rf .next node_modules
npm install
npm run build
```

### Database issues

If you have database errors:
```bash
npx prisma generate
npx prisma migrate reset
```

### File upload not working

Ensure the uploads directory exists and has proper permissions:
```bash
mkdir -p public/uploads/stores
chmod 755 public/uploads
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

MIT

## Support

For issues and questions, please open a GitHub issue.
