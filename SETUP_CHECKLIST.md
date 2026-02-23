# ✅ GitHub Actions Deployment - Setup Checklist

This checklist helps you set up automatic deployment to Vercel via GitHub Actions.

## 📋 Prerequisites

- [ ] GitHub account with repository access
- [ ] Vercel account (free tier)
- [ ] Neon PostgreSQL database account (free tier)
- [ ] Node.js 20+ installed locally
- [ ] Git installed locally

---

## 🔧 Step-by-Step Setup

### 1. Database Setup (Neon)

- [ ] Sign up at [neon.tech](https://neon.tech)
- [ ] Create a new project named `UV Insurance Agency`
- [ ] Select region (e.g., Asia Pacific - Singapore)
- [ ] Copy **Pooled** connection string → `DATABASE_URL`
- [ ] Toggle to **Direct** connection → Copy → `DIRECT_URL`
- [ ] Run `npm run setup` locally to initialize database with seed data

**Database URL Example:**
```
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://USER:PASSWORD@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

### 2. Vercel Setup

- [ ] Sign in at [vercel.com](https://vercel.com) with GitHub
- [ ] Install Vercel CLI: `npm install -g vercel`
- [ ] Authenticate: `vercel login`
- [ ] Link project: `vercel link` (from project root)
- [ ] Create Vercel token:
  - Go to [Vercel Tokens](https://vercel.com/account/tokens)
  - Click "Create Token"
  - Name: `GitHub Actions`
  - Scope: Full Account
  - Copy the token (save it!)

### 3. Get Vercel Project Details

- [ ] Run: `vercel ls`
- [ ] Or check: `cat .vercel/project.json`
- [ ] Note down:
  - **Org ID** (starts with `team_` or is your user ID)
  - **Project ID** (starts with `prj_`)

### 4. Generate JWT Secret

- [ ] Run: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- [ ] Copy the 64-character output

### 5. Add GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these secrets:

| Secret Name | Value | Source |
|-------------|-------|--------|
| `VERCEL_TOKEN` | Your Vercel token | From step 2 |
| `VERCEL_ORG_ID` | Your Vercel org ID | From step 3 |
| `VERCEL_PROJECT_ID` | Your Vercel project ID | From step 3 |
| `DATABASE_URL` | Neon pooled connection | From step 1 |
| `DIRECT_URL` | Neon direct connection | From step 1 |
| `JWT_SECRET` | 64-char random secret | From step 4 |

---

## 🚀 Deploy!

Once all secrets are configured:

```bash
# Push to master/main branch to trigger deployment
git add .
git commit -m "chore: add GitHub Actions deployment"
git push origin master
```

The GitHub Actions workflow will automatically:
1. Install dependencies
2. Run linting
3. Generate Prisma client
4. Build the application
5. Deploy to Vercel production
6. Comment deployment URL on the commit
7. Show deployment summary

---

## ✅ Verification

- [ ] GitHub Actions workflow runs successfully
- [ ] Build completes without errors
- [ ] Deployment URL is posted as commit comment
- [ ] Visit Vercel URL and verify the app loads
- [ ] Test login with demo credentials:
  - Admin: `admin@UV Insurance Agency.in` / `admin123`
  - Agent: `agent@UV Insurance Agency.in` / `agent123`

---

## 📚 Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide with detailed instructions
- **[DEPLOY.md](./DEPLOY.md)** - Quick manual deployment guide
- **[README.md](./README.md)** - Project overview and getting started

---

## 🐛 Troubleshooting

### Build Fails with "Environment variable not found"

→ Ensure all 6 secrets are added to GitHub Repository Settings

### Can't reach database server

→ Check `DATABASE_URL` includes `?sslmode=require&pgbouncer=true`

### Login not working after deployment

→ Ensure `JWT_SECRET` is set in GitHub Secrets and matches what was used to seed the database

### Vercel Token Issues

→ Token may have expired. Create a new token in Vercel dashboard and update the secret

### Rollback to Previous Deployment

```bash
vercel rollback
```

Or use Vercel dashboard → Deployments → Click previous deployment → Promote to Production

---

## 📊 Files Created/Modified

### Created:
- `.github/workflows/deploy.yml` - GitHub Actions workflow
- `.env.example` - Environment variable template
- `.vercelignore` - Vercel deployment exclusions
- `DEPLOYMENT.md` - Complete deployment guide
- `SETUP_CHECKLIST.md` - This file

### Modified:
- `vercel.json` - Enhanced with build commands and CORS headers
- `DEPLOY.md` - Updated to reference automatic deployment
- `README.md` - Updated with deployment links and project info

---

## 🎉 Success!

After completing this checklist, your UV Insurance Agency application will automatically deploy to Vercel on every push to the master/main branch!

**Last Updated:** 2025-02-20
