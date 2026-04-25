# Deployment guide

Full end-to-end from zero to a public live URL in about 5 minutes.

## 1. Push to GitHub

```bash
# from the project root
git init
git add .
git commit -m "ShareChat trending tags system"
git branch -M main

# Create a new public repo on github.com/new (name it e.g. sharechat-trending)
git remote add origin https://github.com/<your-username>/sharechat-trending.git
git push -u origin main
```

## 2. Deploy to Vercel

**Option A — via CLI (fastest)**

```bash
npm i -g vercel
cd sharechat-trending
vercel            # First run: log in, link project, accept defaults
vercel env add ANTHROPIC_API_KEY production
# Paste your key when prompted. Then:
vercel --prod
```

**Option B — via dashboard**

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo
3. Framework preset auto-detects as **Next.js** — accept defaults
4. Before clicking "Deploy", expand **Environment Variables** and add:
   - `ANTHROPIC_API_KEY` = your key from [console.anthropic.com](https://console.anthropic.com/settings/keys)
5. Click **Deploy**

After ~60 seconds you'll get a URL like `https://sharechat-trending-xyz.vercel.app`.

## 3. Sanity-check the deployment

Open these URLs in a browser after deploy:

| URL | Expected |
|---|---|
| `https://<your-url>/` | Mobile feed with ranked trends |
| `https://<your-url>/api/trends` | JSON response with `trends` array |
| `https://<your-url>/api/trends?debug=1` | Same, but with `scoreBreakdown` per trend |

First request is slow (~20s cold start + full pipeline). Subsequent requests within 10 minutes are instant (cached).

## 4. Custom domain (optional)

Vercel → Project → Settings → Domains → Add.

## 5. Troubleshooting

**"ANTHROPIC_API_KEY is not set"** — Add it in Vercel env vars, then redeploy (`vercel --prod`). Env var changes need a redeploy to take effect.

**Empty feed / "all sources returned empty"** — means outbound to `trends.google.com` / news feeds / Reddit failed. Vercel's serverless functions can reach all three; this would only happen during an outage. Check Vercel function logs.

**Slow first load** — expected. Runtime pipeline does 3 HTTP fetches + 1 LLM call. Mitigation: the 10-min cache means only 1 user per 10 minutes eats the cold cost. In production, run a cron job every 8 minutes to keep the cache warm.

## 6. Cost estimate

- **Vercel hobby tier:** free, 100 GB-hours compute, 100k function invocations/month
- **Anthropic Haiku 4.5:** ~$0.001 per pipeline run
  - At 1 run per 10 min (cache-driven) = 144 runs/day = ~$0.14/day = **~$4/month**
  - At 0 actual users (cache warm from cron) = **$0/month** beyond the warming cron
