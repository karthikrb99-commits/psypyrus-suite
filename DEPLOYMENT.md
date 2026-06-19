# PsyPyrus Web Companion Deployment Guide

This document outlines the requirements and procedures for deploying the **PsyPyrus Web Companion** to **Vercel** and **GitHub Pages**.

---

## 📋 Table of Contents
1. [Environment Variables Reference](#-environment-variables-reference)
2. [Vercel Deployment (Recommended)](#-vercel-deployment-recommended)
3. [GitHub Pages Deployment (GitHub Actions)](#-github-pages-deployment-github-actions)
4. [Validating Deployments](#-validating-deployments)

---

## 🔑 Environment Variables Reference

PsyPyrus uses environment variables prefixed with `VITE_` to bundle settings during compilation. You must configure these variables in your deployment dashboards (Vercel Settings or GitHub Repository Secrets/Variables).

| Environment Variable | Description | Default / Fallback |
| :--- | :--- | :--- |
| `VITE_FIREBASE_API_KEY` | Firebase Client Web API Key | `mock-api-key` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Authentication Domain | `mock-auth-domain` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID | `mock-project-id` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket Domain | `mock-storage-bucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Cloud Messaging Sender ID | `mock-sender-id` |
| `VITE_FIREBASE_APP_ID` | Firebase Web App Identifier | `mock-app-id` |
| `VITE_FIREBASE_FIRESTORE_DB_ID` | Firestore Custom DB Identifier | `(default)` |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase Analytics Measurement ID | `""` |
| `VITE_SYNC_API_URL` | URL of the PsyPyrus Sync Service Backend | `http://localhost:3001` |
| `VITE_GEMINI_API_KEY` | Google Gemini API Key for SOAP notes | Falls back to UI-entered key |

> [!NOTE]
> The application uses mock fallbacks if these variables are left unconfigured. This allows the application to build and run in offline/local demo sandbox mode immediately after deployment.

---

## ⚡ Vercel Deployment

Deploying the monorepo to Vercel is streamlined via the pre-configured [vercel.json](./vercel.json) file at the repository root.

### Step-by-Step Vercel Setup:
1. **Import Repository**:
   - Go to your Vercel Dashboard and click **Add New** ➔ **Project**.
   - Import your GitHub repository containing the `psypyrus` codebase.

2. **Configure Project Settings**:
   - **Framework Preset**: Select **Vite** (Vercel should automatically detect this).
   - **Root Directory**: Leave as the repository root `./`. The `vercel.json` file handles directing the build process to the `web/` folder automatically.
   - **Build Command**: `npm run build --prefix web` (handled by `vercel.json`).
   - **Output Directory**: `web/dist` (handled by `vercel.json`).

3. **Configure Environment Variables**:
   - Expand the **Environment Variables** section.
   - Add the variables listed in the [Environment Variables Reference](#-environment-variables-reference) table above.

4. **Deploy**:
   - Click **Deploy**. Vercel will build the companion and host it globally.

---

## 🐙 GitHub Pages Deployment

We use the **Modern GitHub Pages Action** method. This deploys directly from a build artifact created in a secure GitHub runner, preventing history bloat or `gh-pages` branch clutter.

### Step-by-Step GitHub Pages Setup:
1. **Configure Repository Settings**:
   - Go to your GitHub repository, click **Settings** ➔ **Pages**.
   - Under **Build and deployment** ➔ **Source**, select **GitHub Actions** (instead of "Deploy from a branch").

2. **Configure Environment Variables (Optional)**:
   - If you want the live page to build with pre-configured Keys (e.g., public Firebase keys), add them under **Settings** ➔ **Secrets and variables** ➔ **Actions** ➔ **Variables** (or Secrets for the Gemini key if desired).
   - Update your workflow to inject these variables during compilation if necessary, or let the user enter them in the application settings.

3. **Push to `main`**:
   - Whenever you push changes to the `web/` directory on the `main` branch, the [deploy.yml](./.github/workflows/deploy.yml) workflow will run.
   - You can also trigger it manually under the **Actions** tab by choosing the "Deploy to GitHub Pages" workflow and clicking **Run workflow**.

---

## 🧪 Validating Deployments

Once deployed, you can verify your app is running correctly:
1. Check that assets load relatively (Vite compiles `base: './'` to ensure relative imports from subfolders work).
2. Open the Browser Developer Console (`F12` or `Ctrl+Shift+I`) to confirm no asset loading errors (`404`) are occurring.
3. Access the **Settings Drawer** (gear icon) in the app to configure custom keys at runtime. The app's built-in cryptographic audit log (`HIPAA Security Shield` tab) will log initialization hashes to verify security parameters.
