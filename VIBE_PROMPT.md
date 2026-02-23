# 🚀 UV Insurance Agency — Vibe Code Prompt

> Use this prompt to recreate, extend, or onboard AI tools to the full UV Insurance Agency Insurance Management System.

---

## 🧠 PROJECT OVERVIEW

Build a **full-stack Insurance Management System** called **UV Insurance Agency** for an insurance agent in India.
The app is a premium, dark-themed web application built with **Next.js 15**, **TypeScript**, **Prisma ORM**, and **PostgreSQL (Neon)**. It is deployed on **Vercel**.

The brand name is **UV Insurance Agency** with logo initials **UV** (indigo gradient). The tagline is *"Insurance Management System"*.

---

## 🛠️ TECH STACK

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| Database | PostgreSQL via Neon (serverless) |
| ORM | Prisma 6 |
| Auth | JWT (jose) + HTTP-only cookies |
| Password hashing | bcryptjs |
| Styling | Tailwind CSS v4 + custom CSS variables |
| Charts | Recharts |
| Animations | Framer Motion |
| Icons | Lucide React + inline SVGs |
| Date utils | date-fns |
| Deployment | Vercel (serverless) |
| CI/CD | GitHub Actions |

---

## 🎨 DESIGN SYSTEM

### Color Palette (Dark Theme)
```css
--bg-primary: #0a0d14;        /* Page background */
--bg-secondary: #0f1320;      /* Sidebar background */
--bg-card: #131929;           /* Card background */
--bg-glass: rgba(19,25,41,0.8); /* Glassmorphism */
--border: rgba(255,255,255,0.07);
--border-active: rgba(99,102,241,0.5);
--text-primary: #f0f4ff;
--text-secondary: #8b92a9;
--text-muted: #4b5268;
--accent-blue: #6366f1;       /* Primary indigo */
--accent-purple: #8b5cf6;
--accent-cyan: #06b6d4;
--accent-green: #10b981;
--accent-orange: #f59e0b;
--accent-red: #ef4444;
--gradient-primary: linear-gradient(135deg, #6366f1, #8b5cf6);
--gradient-blue: linear-gradient(135deg, #3b82f6, #06b6d4);
--gradient-green: linear-gradient(135deg, #10b981, #059669);
--shadow-glow: 0 0 30px rgba(99,102,241,0.15);
--shadow-card: 0 4px 24px rgba(0,0,0,0.3);
```

### Typography
- Font: **Inter** (Google Fonts), weights 300–900
- `-webkit-font-smoothing: antialiased`

### CSS Utility Classes
- `.glass-card` — glassmorphism cards with backdrop-filter blur
- `.gradient-text` — indigo-purple gradient text
- `.btn-glow` — indigo gradient button with glow shadow + hover lift
- `.animated-bg` — radial gradient animated background
- `.badge` + `.badge-active/expired/pending/cancelled/health/motor/life/term`
- `.sidebar-link` — nav link with active state
- `.table-dark` — dark themed table
- `.animate-fade-in` — fade + slide up animation
- `.animate-slide-in` — slide from left
- `.animate-pulse-glow` — pulsing glow effect
- `.modal-backdrop` — blurred modal overlay
- `.stat-card` — dashboard stat card with hover effect

---

## 🗄️ DATABASE SCHEMA (Prisma)

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")   // pooler URL (with -pooler)
  directUrl = env("DIRECT_URL")     // direct URL (without -pooler)
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String   // bcrypt hashed
  role      String   @default("AGENT") // ADMIN | AGENT | AUDITOR
  avatar    String?
  phone     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  customers Customer[]
  calls     CallLog[]
  notes     Note[]
  policies  Policy[]
}

model Customer {
  id          String   @id @default(cuid())
  firstName   String
  lastName    String
  email       String?
  phone       String
  dob         String?
  gender      String?
  address     String?
  city        String?
  state       String?
  pincode     String?
  occupation  String?
  income      String?
  // KYC
  aadharNo    String?
  panNo       String?
  kycStatus   String   @default("PENDING") // PENDING | VERIFIED | REJECTED
  // Photos & Documents (URLs — Cloudinary or local)
  livePhoto   String?
  aadharFront String?
  aadharBack  String?
  panPhoto    String?
  // Pre-existing conditions (JSON string array)
  preExisting String?
  status      String   @default("ACTIVE")
  agentId     String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  agent       User     @relation(...)
  policies    Policy[]
  family      FamilyMember[]
  notes       Note[]
  callLogs    CallLog[]
  proposerFor Policy[] @relation("ProposerRelation")
}

model FamilyMember {
  id          String   @id @default(cuid())
  customerId  String
  name        String
  relation    String
  dob         String?
  gender      String?
  preExisting String?
  insured     Boolean  @default(false)
  createdAt   DateTime @default(now())
  customer    Customer @relation(onDelete: Cascade)
}

model Policy {
  id              String   @id @default(cuid())
  policyNumber    String   @unique
  type            String   // HEALTH | MOTOR | LIFE | TERM
  subType         String?
  company         String
  planName        String
  sumInsured      Float?
  premium         Float
  paymentMode     String   @default("ANNUAL") // ANNUAL | SEMI | QUARTER | MONTHLY
  startDate       String
  endDate         String
  issueDate       String?
  status          String   @default("ACTIVE") // ACTIVE | EXPIRED | CANCELLED | RENEWED
  tags            String?  // JSON string array
  customerId      String
  proposerId      String?
  agentId         String
  // Motor-specific
  vehicleNo       String?
  vehicleModel    String?
  vehicleYear     String?
  // Life-specific
  nominee         String?
  nomineeRelation String?
  reminderSent    Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  customer        Customer @relation(...)
  proposer        Customer? @relation("ProposerRelation")
  agent           User     @relation(...)
  documents       Document[]
}

model Document {
  id        String   @id @default(cuid())
  policyId  String
  name      String
  type      String
  url       String
  size      Int?
  createdAt DateTime @default(now())
  policy    Policy   @relation(onDelete: Cascade)
}

model CallLog {
  id         String   @id @default(cuid())
  customerId String
  agentId    String
  type       String   // INCOMING | OUTGOING | MISSED
  duration   Int?     // seconds
  notes      String?
  outcome    String?  // INTERESTED | NOT_INTERESTED | CALLBACK | POLICY_SOLD | RENEWAL
  callDate   DateTime @default(now())
  customer   Customer @relation(...)
  agent      User     @relation(...)
}

model Note {
  id         String   @id @default(cuid())
  customerId String
  agentId    String
  content    String
  type       String   @default("GENERAL") // GENERAL | FOLLOWUP | COMPLAINT | RENEWAL
  createdAt  DateTime @default(now())
  customer   Customer @relation(...)
  agent      User     @relation(...)
}

model Notification {
  id         String   @id @default(cuid())
  title      String
  message    String
  type       String   // RENEWAL | PAYMENT | BIRTHDAY | FOLLOWUP
  targetId   String?
  targetType String?
  isRead     Boolean  @default(false)
  createdAt  DateTime @default(now())
}
```

---

## 🔐 AUTHENTICATION

- **JWT-based** using `jose` library
- Tokens stored in **HTTP-only cookies** (not localStorage)
- Login route: `POST /api/auth/login` — validates credentials with bcrypt, issues JWT
- Logout route: `POST /api/auth/logout` — clears cookie
- **Middleware** (src/middleware.ts): Protects all routes except `/` and `/api/auth/*`. Reads JWT from cookie, verifies, sets user info in request headers.
- **Brute-force protection** on login UI: 5 attempts max → 30-second lockout (stored in sessionStorage)
- **Caps Lock warning** on password field
- **Demo credentials** shown on login page:
  - Admin: `admin@UV Insurance Agency.in` / `admin123`
  - Agent: `agent@UV Insurance Agency.in` / `agent123`

---

## 📁 PROJECT STRUCTURE

```
src/
├── app/
│   ├── page.tsx              # Login page (full-screen, animated dark bg, glassmorphism card)
│   ├── layout.tsx            # Root layout (Inter font, dark bg)
│   ├── globals.css           # Global CSS with design system variables
│   ├── dashboard/
│   │   └── page.tsx          # Main dashboard with stats, charts, recent activity
│   ├── customers/
│   │   ├── page.tsx          # Customer list with search/filter
│   │   ├── new/page.tsx      # Add new customer form
│   │   └── [id]/page.tsx     # Customer detail/edit — tabbed: Profile, KYC, Policies, Family, Notes, Calls
│   ├── policies/
│   │   ├── page.tsx          # Policy list with type/status filters
│   │   ├── new/page.tsx      # Add new policy form (dynamic fields by type)
│   │   └── [id]/page.tsx     # Policy detail with documents
│   ├── renewals/
│   │   └── page.tsx          # Upcoming renewals (expiring <30 days), sorted by urgency
│   ├── calls/
│   │   └── page.tsx          # Call log tracker with new call modal
│   ├── reports/
│   │   └── page.tsx          # Charts: premium by type, monthly trend, KYC status, policy status
│   ├── admin/
│   │   └── page.tsx          # Admin: user management, system stats
│   ├── setup/
│   │   └── page.tsx          # DB setup page (run seed from browser)
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts    # POST: email+password → JWT cookie
│       │   ├── logout/route.ts   # POST: clear cookie
│       │   └── me/route.ts       # GET: current user from JWT
│       ├── customers/
│       │   ├── route.ts          # GET (list) + POST (create)
│       │   └── [id]/route.ts     # GET + PUT + DELETE
│       ├── policies/
│       │   ├── route.ts          # GET (list) + POST (create)
│       │   └── [id]/route.ts     # GET + PUT + DELETE
│       ├── calls/route.ts        # GET + POST
│       ├── notes/route.ts        # GET + POST
│       ├── dashboard/route.ts    # GET: aggregated stats
│       ├── admin/route.ts        # GET: admin-only data
│       └── health/
│           ├── route.ts          # GET: app health check
│           └── db/route.ts       # GET: database connectivity check
├── components/
│   └── Sidebar.tsx           # Collapsible sidebar, role-based nav, user profile + logout
└── lib/
    ├── db.ts                 # Prisma singleton, error handlers, DB health check
    └── auth.ts               # JWT helpers: sign, verify, getUser from request
```

---

## 🧩 KEY FEATURES

### 1. Login Page (`/`)
- Animated dark background with grid + glow orbs
- Glassmorphism login card
- Brute-force protection with visual attempt counter bar
- Caps Lock warning
- Show/hide password toggle
- Demo credential quick-fill buttons
- Security badge showing security features

### 2. Dashboard (`/dashboard`)
- Stat cards: Total Customers, Active Policies, Monthly Premium, Renewals Due
- Charts (Recharts): Policy mix pie chart, monthly premium bar chart
- Recent policies table
- Upcoming renewals alerts
- Quick action buttons

### 3. Customers (`/customers`)
- Searchable, filterable customer list
- KYC status badges (VERIFIED/PENDING/REJECTED)
- **Customer Detail** is tabbed:
  - **Profile**: Personal info, contact, address, financial
  - **KYC**: Aadhaar, PAN, photo uploads (live photo, doc scans)
  - **Policies**: All linked policies with status
  - **Family**: Family members with insured flag
  - **Notes**: Agent notes by type (general/followup/complaint/renewal)
  - **Calls**: Call history with type, duration, outcome

### 4. Policies (`/policies`)
- Filter by type (Health/Motor/Life/Term) and status (Active/Expired/etc)
- Dynamic form fields based on policy type:
  - **Health**: Sum insured, plan type, sub-type
  - **Motor**: Vehicle number, model, year
  - **Life**: Nominee name and relation
- Tags support (JSON array stored as string)
- Document attachments per policy
- Proposer linking (another customer as proposer)

### 5. Renewals (`/renewals`)
- Shows policies expiring within 30 days
- Color-coded urgency (red < 7 days, orange < 15 days, yellow < 30 days)
- One-click call/note actions

### 6. Call Tracker (`/calls`)
- Log calls: type (INCOMING/OUTGOING/MISSED), duration, notes, outcome
- Filter by outcome and date
- Stats: total calls, avg duration, conversion rate

### 7. Reports (`/reports`)
- Recharts visualizations:
  - Premium breakdown by insurance type (pie chart)
  - Monthly premium trend (bar chart)
  - KYC status distribution (donut)
  - Policy status breakdown
- Export data to CSV

### 8. Admin Panel (`/admin`)
- Accessible only to users with role `ADMIN`
- User management (list agents)
- System-wide stats

### 9. Setup Page (`/setup`)
- Browser-accessible page to initialize/seed database
- Useful for first-time production setup

---

## 🔧 ENVIRONMENT VARIABLES

```env
# Neon PostgreSQL — Pooled (runtime app connection)
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require"

# Neon PostgreSQL — Direct (for prisma db push / migrate — NO -pooler in URL)
DIRECT_URL="postgresql://USER:PASSWORD@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"

# JWT Secret (64+ chars recommended)
JWT_SECRET="your-long-random-secret-key-here"

# Environment
NODE_ENV="development"  # or "production"
```

> ⚠️ `DATABASE_URL` uses the **pooler** endpoint (`-pooler` in hostname).  
> ⚠️ `DIRECT_URL` uses the **direct** endpoint (no `-pooler`). Required for `prisma db push`.

---

## 📜 NPM SCRIPTS

```json
"dev": "next dev -p 7000",
"build": "prisma generate && next build",
"start": "next start",
"postinstall": "prisma generate",
"db:generate": "prisma generate",
"db:push": "prisma db push",
"db:migrate": "prisma migrate deploy",
"db:seed": "npx tsx prisma/seed.ts",
"db:studio": "prisma studio",
"db:reset": "prisma migrate reset --force && npx tsx prisma/seed.ts",
"setup": "prisma generate && prisma db push && npx tsx prisma/seed.ts"
```

---

## 🚀 DEPLOYMENT (Vercel)

1. Connect GitHub repo `SHARPvasu/UV Insurance Agency` to Vercel
2. Set environment variables in Vercel dashboard:
   - `DATABASE_URL` (pooler URL)
   - `DIRECT_URL` (direct URL)
   - `JWT_SECRET`
   - `NODE_ENV=production`
3. Build command: `npm run build`
4. Output directory: `.next`
5. After deploy, run seed: visit `/setup` page or run `npm run db:seed` via Vercel CLI

---

## 🌱 SEED DATA

The `prisma/seed.ts` creates:

**Users:**
- Admin: `admin@UV Insurance Agency.in` / `admin123` (role: ADMIN)
- Agent: `agent@UV Insurance Agency.in` / `agent123` (role: AGENT)
- Auditor: `auditor@UV Insurance Agency.in` / `auditor123` (role: AUDITOR — name: Anita Verma)

**Customers:**
- Vikram Patel (Mumbai, KYC Verified, Diabetes pre-existing)
- Priya Mehta (Bangalore, KYC Verified, Doctor)
- Arjun Singh (Delhi, KYC Pending, Business Owner)

**Policies:**
- SH-2024-001: Star Health Comprehensive Gold (Health, Active)
- HD-2024-002: HDFC ERGO Comprehensive Car (Motor, expiring soon)
- LIC-2023-003: LIC Jeevan Anand (Life, 20-year term)
- NI-2023-004: Niva Bupa ReAssure 2.0 (Health, Expired)

**Also created:** Family member, 2 notes, 2 call logs

---

## 🧠 SIDEBAR NAVIGATION

```
📊 Dashboard
👥 Customers
🛡️  Policies
🔄 Renewals
📞 Call Tracker
📈 Reports
─────── (Admin only)
⚙️  Admin Panel
```

- Collapsible to icon-only mode (64px wide)
- Role-based visibility for Admin section
- Fixed position, 240px wide when expanded
- Active state: indigo highlight with border
- User profile at bottom with initials avatar + logout button

---

## 💡 CODING CONVENTIONS

- All API routes: Next.js App Router route handlers (`route.ts`)
- All API routes extract user from `x-user-*` request headers (set by middleware after JWT verification)
- Prisma client: singleton pattern in `src/lib/db.ts`, exported as `prisma`
- All pages are Server Components by default; interactive pages use `'use client'`
- Inline styles used extensively for dynamic/conditional styling
- CSS classes from `globals.css` for reusable patterns
- Error handling: structured JSON responses `{ error: string }` with appropriate HTTP status codes
- Date format: `YYYY-MM-DD` strings for policy dates (not DateTime) for simplicity

---

## ➕ FEATURES TO ADD (Future)

- [ ] Cloudinary integration for photo/document uploads
- [ ] WhatsApp notification for renewals
- [ ] PDF policy card generation
- [ ] Auditor role and section
- [ ] Multi-company commission tracking
- [ ] Customer mobile app (React Native / PWA)
- [ ] Email reminders via Resend/Nodemailer
- [ ] Bulk import customers via CSV
- [ ] Role: AUDITOR with read-only access
- [ ] Advanced analytics with AI suggestions

---

*UV Insurance Agency © 2026 — Built with ❤️ for insurance agents in India*
