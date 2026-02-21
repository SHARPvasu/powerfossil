# 🚀 PowerFossil — Quick Vercel Deployment Guide

## Overview

**⚡ Recommended:** For automatic deployment via GitHub Actions, see **[DEPLOYMENT.md](./DEPLOYMENT.md)**

This guide provides a quick manual deployment to **Vercel** (free hosting) with **Neon** (free PostgreSQL database).

---

## Step 1 — Set Up Neon Database (Free PostgreSQL)

1. Go to **[neon.tech](https://neon.tech)** → Sign up (free)
2. Click **"New Project"** → Name it `powerfossil` → Region: **Asia Pacific (Singapore)** → Create
3. On the dashboard, click **"Connection Details"**
4. Copy **two** connection strings:
   - **Pooled connection** (shown by default with `?pgbouncer=true` at the end) → This is your `DATABASE_URL`
   - Switch toggle to **"Direct"** → Copy that URL → This is your `DIRECT_URL`

They look like:
```
postgresql://USER:PASSWORD@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true
postgresql://USER:PASSWORD@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

---

## Step 2 — Initialize the Database (Run Locally Once)

Create a `.env.local` file in your project root (copy from `.env.example`):

```env
DATABASE_URL="postgresql://USER:PASSWORD@...neon.tech/neondb?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://USER:PASSWORD@...neon.tech/neondb?sslmode=require"
JWT_SECRET=your-random-64-char-secret
NODE_ENV=development
```

Generate a strong JWT secret:
```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Then push the schema and seed data:
```powershell
npm run setup
```

You should see:
```
✅ Admin user created: admin@powerfossil.in
✅ Agent user created: agent@powerfossil.in
✅ Sample customers created
✅ Sample policies created
🎉 Database seeded successfully!
```

---

## Step 3 — Deploy to Vercel

### Option A: Automatic Deployment (Recommended)

For automatic CI/CD deployment via GitHub Actions, follow **[DEPLOYMENT.md](./DEPLOYMENT.md)** for detailed setup instructions.

### Option B: Manual Deployment

1. Go to **[vercel.com](https://vercel.com)** → Sign in with GitHub
2. Click **"Add New Project"** → Import `powerfossil` repo
3. Framework: **Next.js** (auto-detected)
4. Click **"Environment Variables"** and add ALL of these:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Neon **pooled** connection string |
| `DIRECT_URL` | Your Neon **direct** connection string |
| `JWT_SECRET` | Your 64-char random secret |
| `NODE_ENV` | `production` |

5. Click **"Deploy"** 🚀

Build command runs automatically: `prisma generate && next build`

---

## Step 4 — Verify Deployment

Once deployed, visit your Vercel URL (e.g. `https://powerfossil.vercel.app`):

- Login with `admin@powerfossil.in` / `admin123`
- Login with `agent@powerfossil.in` / `agent123`

---

## Updating the App

### With GitHub Actions (Recommended)
```powershell
git add .
git commit -m "feat: your change description"
git push
```
Deployment happens automatically! ✅

### Manual Deployment
```powershell
vercel --prod
```

---

## If You Change the Database Schema

```powershell
# Push schema changes to Neon
npm run db:push

# Re-generate the Prisma client
npm run db:generate

# Then push to git (auto-deploy) or run vercel --prod
git add prisma/schema.prisma
git commit -m "chore: update schema"
git push
```

---

## Free Tier Limits

| Service | Free Tier |
|---------|-----------|
| **Vercel** | Unlimited deploys, 100GB bandwidth/mo |
| **Neon** | 0.5 GB storage, 1 project, 1 branch |

Both free tiers are more than enough for production use as an insurance agent platform.

---

## Troubleshooting

### "Can't reach database server"
→ Check `DATABASE_URL` is set correctly in Vercel Environment Variables

### "PrismaClientInitializationError"
→ Make sure `DIRECT_URL` is also set in Vercel (needed for migrations)

### Build fails with "Environment variable not found: DATABASE_URL"
→ In Vercel project settings → Environment Variables → make sure both vars are added to **Production** environment

### Login not working after deploy
→ Make sure `JWT_SECRET` is set in Vercel. Run `npm run db:seed` locally pointing at Neon to create the users.

---

## Need More Details?

For comprehensive deployment documentation including GitHub Actions setup, see **[DEPLOYMENT.md](./DEPLOYMENT.md)**.
