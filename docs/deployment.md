# AcademiaAI Deployment Guide

This guide covers recommended strategies for deploying AcademiaAI to production.

---

## Architecture Requirements Overview

| Component | Tech Stack | Recommended Spec | Free Hosting Options |
| :--- | :--- | :--- | :--- |
| **Frontend** | React, Vite, Tailwind CSS v4 | Static HTML/JS | **Vercel**, **Netlify**, **Cloudflare Pages** |
| **Backend API** | FastAPI, PyTorch, FAISS | Minimum 1.5–2 GB RAM | **Hugging Face Spaces** (16GB RAM Free), **Render**, **Railway** |

> [!NOTE]
> Because the backend runs local sentence embeddings (`BAAI/bge-base-en-v1.5`) and FAISS, it requires at least **1.5 GB of RAM**. Standard 512 MB free tiers (like Render free web service) may run out of memory when loading PyTorch. For a 100% free solution with plenty of RAM, **Hugging Face Spaces** or **Railway** is recommended.

---

## Option 1: Vercel (Frontend) + Hugging Face Spaces or Render (Backend) [Recommended]

### 1. Deploy the Backend to Hugging Face Spaces (100% Free - 16 GB RAM)
1. Go to [Hugging Face Spaces](https://huggingface.co/spaces) and click **Create new Space**.
2. Space name: `academiaai-backend`
3. Space SDK: Select **Docker** (Blank).
4. Hardware: Select **CPU Basic (2 vCPU · 16 GB RAM) — FREE**.
5. Push your code or connect your GitHub repository `Manikantasai1724/AcademiaAI`.
6. Go to **Settings -> Variables and secrets**:
   - `GEMINI_API_KEY`: `your_gemini_api_key`
   - `GEMINI_MODEL_NAME`: `gemini-3.8-flash`
   - `EMBEDDING_MODEL_NAME`: `BAAI/bge-base-en-v1.5`
7. Your backend will be live at:
   `https://<your-username>-academiaai-backend.hf.space`

---

### 2. Deploy the Frontend to Vercel (100% Free)
1. Go to [Vercel](https://vercel.com/) and click **Add New Project**.
2. Import your GitHub repository: `Manikantasai1724/AcademiaAI`.
3. Set **Root Directory** to: `frontend`
4. In **Environment Variables**, add:
   - `VITE_API_URL`: `https://<your-backend-domain>/api`
   *(Example: `https://your-username-academiaai-backend.hf.space/api`)*
5. Click **Deploy**. Vercel will build and host your frontend globally with SSL.

---

## Option 2: Render (Full-Stack PaaS)

### Backend Service:
1. Connect your repo on [Render Dashboard](https://dashboard.render.com/).
2. Select **Web Service**.
3. Runtime: **Docker** (Render will automatically detect the root `Dockerfile`).
4. Plan: **Starter (2 GB RAM)** or higher.
5. Add Environment Variables:
   - `GEMINI_API_KEY`: `your_key`
   - `GEMINI_MODEL_NAME`: `gemini-3.8-flash`
   - `EMBEDDING_MODEL_NAME`: `BAAI/bge-base-en-v1.5`
6. Attach a **Persistent Disk** (mounted at `/app/data`) so your FAISS vector index and uploaded files survive server restarts.

### Frontend Service:
1. Create a **Static Site** on Render.
2. Root directory: `frontend`
3. Build command: `npm install && npm run build`
4. Publish directory: `dist`
5. Add Environment Variable:
   - `VITE_API_URL`: `https://<your-render-backend-url>/api`

---

## Option 3: Single-Server VPS with Docker Compose (AWS, DigitalOcean, Hetzner)

If you have a Linux VPS (Ubuntu/Debian) with Docker and Docker Compose installed:

1. **Clone the repository on your server**:
   ```bash
   git clone https://github.com/Manikantasai1724/AcademiaAI.git
   cd AcademiaAI
   ```

2. **Configure `.env`**:
   ```bash
   cp .env.example .env
   nano .env
   ```
   Add your `GEMINI_API_KEY`.

3. **Start the containers in detached mode**:
   ```bash
   docker compose up -d --build
   ```

4. **Verify running services**:
   ```bash
   docker compose ps
   ```
   - Frontend will be live on port `5173` (or port 80 behind an Nginx reverse proxy / Cloudflare).
   - Backend will be live on port `8000`.
   - All uploaded documents and FAISS indexes are persistently saved in `./data/uploads` and `./data/faiss`.
