# 🚀 PowerFossil - Automatic Deployment Guide

This guide covers setting up automatic deployment to Vercel using GitHub Actions CI/CD.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [GitHub Secrets Configuration](#github-secrets-configuration)
4. [Database Setup](#database-setup)
5. [GitHub Actions Workflow](#github-actions-workflow)
6. [Manual Deployment](#manual-deployment)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before setting up automatic deployment, ensure you have:

- [x] GitHub account with repository access
- [x] Vercel account (free tier is sufficient)
- [x] Neon PostgreSQL database account (free tier is sufficient)
- [x] Node.js 20+ installed locally
- [x] Git installed locally

---

## Initial Setup

### 1. Fork or Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/powerfossil.git
cd powerfossil
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Connect to Vercel

Install and authenticate Vercel CLI:

```bash
npm install -g vercel
vercel login
```

Link your project to Vercel:

```bash
vercel link
```

This will create a `.vercel` directory and generate your project configuration.

### 4. Get Vercel Project Details

After linking, you can find your project details:

```bash
vercel ls
```

Or check `.vercel/project.json`:

```bash
cat .vercel/project.json
```

Note down:
- **Org ID** - Starts with `team_` or is your user ID
- **Project ID** - Starts with `prj_`

---

## GitHub Secrets Configuration

You need to add the following secrets to your GitHub repository:

### Navigate to Repository Secrets

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

### Required Secrets

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `VERCEL_TOKEN` | Vercel authentication token | From Vercel Settings → Tokens |
| `VERCEL_ORG_ID` | Your Vercel organization/team ID | From `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | Your Vercel project ID | From `.vercel/project.json` |
| `DATABASE_URL` | Neon pooled connection string | From Neon dashboard |
| `DIRECT_URL` | Neon direct connection string | From Neon dashboard |
| `JWT_SECRET` | 64-character random secret | Generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |

### Getting Vercel Token

1. Go to [Vercel Dashboard](https://vercel.com/account/tokens)
2. Click **Create Token**
3. Name it: `GitHub Actions` or similar
4. Scope: **Full Account**
5. Copy and save the token immediately (you won't see it again)

---

## Database Setup

### 1. Create Neon Database

1. Go to [neon.tech](https://neon.tech) → Sign up (free)
2. Click **"New Project"**
3. Name: `powerfossil`
4. Region: **Asia Pacific (Singapore)** (recommended) or closest to your users
5. Click **Create Project**

### 2. Get Connection Strings

On the Neon dashboard:

1. Click **"Connection Details"**
2. Copy the **Pooled** connection string (default) → `DATABASE_URL`
   ```
   postgresql://USER:PASSWORD@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true
   ```
3. Toggle to **Direct** connection → Copy → `DIRECT_URL`
   ```
   postgresql://USER:PASSWORD@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

### 3. Set Up Database Schema Locally (One-time)

Create `.env.local`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@...neon.tech/neondb?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://USER:PASSWORD@...neon.tech/neondb?sslmode=require"
JWT_SECRET=your-64-char-random-secret
NODE_ENV=development
```

Run the database setup:

```bash
npm run setup
```

This will:
- Generate Prisma client
- Push schema to database
- Seed initial data (admin & agent users)

You should see:

```
✅ Admin user created: admin@powerfossil.in
✅ Agent user created: agent@powerfossil.in
✅ Sample customers created
✅ Sample policies created
🎉 Database seeded successfully!
```

### 4. Demo Credentials

After seeding, you can login with:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@powerfossil.in | admin123 |
| Agent | agent@powerfossil.in | agent123 |

---

## GitHub Actions Workflow

### How It Works

The `.github/workflows/deploy.yml` workflow automatically:

1. **Triggers** on every push to `master` or `main` branch
2. **Installs** dependencies using npm ci
3. **Runs** linting (continues on error)
4. **Generates** Prisma client with database schema
5. **Builds** the Next.js application
6. **Deploys** to Vercel production
7. **Comments** deployment URL on the commit
8. **Displays** deployment summary

### Manual Trigger

You can also trigger deployment manually:

1. Go to **Actions** tab in GitHub
2. Select **Deploy to Vercel** workflow
3. Click **Run workflow** → **Run workflow**

### Workflow Features

- ✅ Automatic builds on every push
- ✅ Lint checks before deployment
- ✅ Prisma schema generation
- ✅ Production build optimization
- ✅ Zero-downtime deployments via Vercel
- ✅ Deployment URL posted as commit comment
- ✅ Detailed deployment summary

---

## Manual Deployment

If you need to deploy manually without GitHub Actions:

### Using Vercel CLI

```bash
# Build for production
npm run build

# Deploy to production
vercel --prod
```

### Using Vercel Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your `powerfossil` project
3. Ensure `DATABASE_URL`, `DIRECT_URL`, and `JWT_SECRET` are saved as **Plaintext** environment variables (not Secret references)
4. Click **Deployments**
5. Click **Redeploy** (if needed)

---

## Database Migrations

### After Schema Changes

If you modify `prisma/schema.prisma`:

```bash
# Push changes to database
npm run db:push

# Regenerate Prisma client
npm run db:generate

# Commit and push to trigger deployment
git add .
git commit -m "chore: update database schema"
git push
```

### Reset Database (⚠️ Deletes all data)

```bash
npm run db:reset
```

---

## Troubleshooting

### Build Fails in GitHub Actions

**Error: "Environment variable not found"**

→ Ensure all secrets are set in GitHub Repository Settings:
- `DATABASE_URL`
- `DIRECT_URL`
- `JWT_SECRET`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

**Error: "Can't reach database server"**

→ Check `DATABASE_URL` is correct and includes `?sslmode=require&pgbouncer=true`

**Error: "PrismaClientInitializationError"**

→ Ensure `DIRECT_URL` is also set in GitHub Secrets

### Deployment Successful But Login Not Working

→ Check `JWT_SECRET` matches between local and GitHub Secrets

### "Environment Variable 'DATABASE_URL' references Secret 'database_url'"

→ In Vercel project settings, delete `DATABASE_URL` and re-add it as **Plaintext** (not a Secret reference). Do the same for `DIRECT_URL`.

### Vercel Token Issues

→ Token might have expired. Create a new token in Vercel dashboard and update the secret.

### Database Connection Issues

→ Neon database might be paused. Visit Neon dashboard to wake it up.

### Rollback to Previous Deployment

```bash
vercel rollback
```

Or use Vercel dashboard:
1. Go to **Deployments**
2. Click on previous deployment
3. Click **Promote to Production**

---

## File Structure

```
.github/
  workflows/
    deploy.yml          # GitHub Actions workflow
.vercelignore           # Files to exclude from Vercel
.env.example           # Environment variable template
vercel.json            # Vercel configuration
prisma/
  schema.prisma        # Database schema
  seed.ts              # Database seeding script
```

---

## Environment Variables Reference

### Local Development (.env.local)

```env
DATABASE_URL="pooled-connection-string"
DIRECT_URL="direct-connection-string"
JWT_SECRET="64-char-random-secret"
NODE_ENV="development"
```

### Production (GitHub Secrets)

Add all the above variables to GitHub Secrets.

---

## Best Practices

1. **Never commit** `.env` files - they're in `.gitignore`
2. **Always use** `.env.example` as a template
3. **Rotate secrets** periodically (especially JWT_SECRET)
4. **Monitor deployments** via GitHub Actions tab
5. **Test locally** before pushing to master
6. **Keep database schema changes** in version control
7. **Use feature branches** for development, merge to master for deployment

---

## Free Tier Limits

| Service | Free Tier |
|---------|-----------|
| **Vercel** | Unlimited deploys, 100GB bandwidth/mo, 6GB RAM |
| **Neon** | 0.5GB storage, 1 project, 1 branch, 1B row reads/mo |

Both free tiers are sufficient for production use as an insurance agent platform.

---

## Support & Documentation

- **Vercel Docs**: https://vercel.com/docs
- **Neon Docs**: https://neon.tech/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs

---

## Quick Reference Commands

```bash
# Development
npm run dev              # Start dev server on port 7000
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema changes
npm run db:migrate       # Run migrations
npm run db:seed          # Seed database with initial data
npm run db:reset         # Reset database and reseed
npm run db:studio        # Open Prisma Studio

# Deployment
vercel                   # Deploy to preview
vercel --prod            # Deploy to production
vercel ls                # List deployments
vercel logs              # View deployment logs
```

---

## Success Checklist

After setup, you should have:

- [ ] GitHub repository created/forked
- [ ] All GitHub Secrets configured
- [ ] Neon database created and connection strings noted
- [ ] Database schema pushed and seeded
- [ ] `.github/workflows/deploy.yml` committed
- [ ] Push to master triggers deployment
- [ ] App is accessible via Vercel URL
- [ ] Login works with demo credentials
- [ ] All features functional in production

---

**Last Updated:** 2025-02-20
