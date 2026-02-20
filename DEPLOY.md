# 🚀 PowerFossil — Vercel Deployment Guide

## Overview
This guide deploys PowerFossil to **Vercel** (free hosting) with **Neon** (free PostgreSQL database).

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
cd "e:\insurance agent projec\powerfossil"
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
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

## Step 3 — Push Code to GitHub

```powershell
cd "e:\insurance agent projec\powerfossil"

# Initialize git (if not already done)
git init
git add .
git commit -m "feat: initial PowerFossil release"

# Create repo on github.com → New Repository → powerfossil → Copy the remote URL
git remote add origin https://github.com/YOUR_USERNAME/powerfossil.git
git branch -M main
git push -u origin main
```

---

## Step 4 — Deploy to Vercel

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

## Step 5 — Verify Deployment

Once deployed, visit your Vercel URL (e.g. `https://powerfossil.vercel.app`):

- Login with `admin@powerfossil.in` / `admin123`
- Login with `agent@powerfossil.in` / `agent123`

---

## Updating the App (Future Deploys)

```powershell
git add .
git commit -m "feat: your change description"
git push
```
Vercel auto-deploys on every push to `main`. ✅

---

## If You Change the Database Schema

```powershell
# Push schema changes to Neon
npx prisma db push

# Re-generate the Prisma client
npx prisma generate

# Then push to git (Vercel will rebuild automatically)
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
→ Make sure `JWT_SECRET` is set in Vercel. Run `npx tsx prisma/seed.ts` locally pointing at Neon to create the users.
