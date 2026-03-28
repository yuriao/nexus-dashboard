# Nexus Intel Dashboard

React frontend for the [Nexus](https://github.com/yuriao/nexus) Autonomous Competitive Intelligence Platform.

## Live Demo
👉 **https://yuriao.github.io/nexus-dashboard/**

> Requires a running Nexus backend. Set `VITE_API_URL` to your backend URL.

## Pages

| Page | Description |
|------|-------------|
| Dashboard | Stats overview + recent reports + tracked companies |
| Companies | List, add, search companies — trigger AI reports |
| Reports | Paginated report list with confidence scores |
| Report Detail | Full report with opportunities, risks, predictions, live WebSocket progress |
| Intel Feed | Raw scraped data points filtered by company and source type |

## Local dev

```bash
cp .env.example .env        # set VITE_API_URL
npm install
npm run dev
```

## Deploy

Pushes to `main` auto-deploy to GitHub Pages via GitHub Actions.
