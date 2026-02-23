# UV Insurance Agency - Insurance Management System

A comprehensive insurance agent management platform built with modern web technologies.

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL database (Neon recommended)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your database credentials

# Initialize database
npm run setup

# Start development server
npm run dev
```

Visit [http://localhost:7000](http://localhost:7000) to access the application.

## 📦 Features

- **Dashboard** - Overview statistics and quick actions
- **Customer Management** - Full CRUD with KYC tracking
- **Policy Management** - Health, Motor, Life, and Term insurance
- **Call Logs** - Track all customer interactions
- **Notes System** - Customer notes with categories
- **Renewals** - Track expiring policies
- **Reports & Analytics** - Business insights and CSV export
- **Admin Panel** - User management
- **Notifications** - System alerts and reminders

## 🗄️ Database Setup

### Using Neon (Recommended)

1. Create a free account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy connection strings (both Pooled and Direct)
4. Add them to your `.env.local` file

### Local Development

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed initial data
npm run db:seed
```

### Demo Credentials

After seeding:

- **Admin:** admin@uvinsurance.in / admin123
- **Agent:** agent@uvinsurance.in / agent123

## 🚢 Deployment

### Automatic Deployment (Recommended)

For automatic CI/CD deployment via GitHub Actions, see **[DEPLOYMENT.md](./DEPLOYMENT.md)**

### Quick Manual Deployment

For quick manual deployment to Vercel, see **[DEPLOY.md](./DEPLOY.md)**

### Key Files

- `.github/workflows/deploy.yml` - GitHub Actions workflow
- `vercel.json` - Vercel configuration
- `.env.example` - Environment variable template
- `.vercelignore` - Vercel deployment exclusions

## 🛠️ Available Scripts

```bash
# Development
npm run dev              # Start dev server on port 7000
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema changes
npm run db:migrate       # Run migrations
npm run db:seed          # Seed database with initial data
npm run db:reset         # Reset database and reseed
npm run db:studio        # Open Prisma Studio

# Setup (one-time)
npm run setup            # Generate, push, and seed database
```

## 📁 Project Structure

```
UV Insurance Agency/
├── src/
│   ├── app/              # Next.js app router
│   │   ├── api/         # API routes
│   │   ├── dashboard/   # Dashboard pages
│   │   ├── customers/   # Customer management
│   │   └── ...
│   ├── components/       # React components
│   └── lib/             # Utility functions
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Database seeding
└── public/              # Static assets
```

## 🏗️ Tech Stack

- **Framework:** Next.js 15 with App Router
- **Frontend:** React 19, Tailwind CSS 4, Lucide React
- **Backend:** Next.js API Routes, TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT (jose library), bcryptjs
- **Hosting:** Vercel
- **Database:** Neon PostgreSQL

## 🔐 Security Features

- JWT-based authentication
- HTTP-only cookies
- Password hashing with bcryptjs
- Role-based access control (ADMIN, AGENT, AUDITOR)
- SQL injection protection via Prisma

## 📄 Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide with GitHub Actions
- **[DEPLOY.md](./DEPLOY.md)** - Quick manual deployment guide
- **[BUILD_FIXES.md](./BUILD_FIXES.md)** - Build fixes and troubleshooting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is proprietary software.

## 💬 Support

For issues and questions, please refer to the documentation files or contact the development team.

---

**Built with ❤️ using Next.js and modern web technologies**
