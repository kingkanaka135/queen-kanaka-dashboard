# Queen — Sovereign Assistant

## Getting Queen actually talking (do this first)

Queen's AI brain needs a backend to hold your Anthropic API key safely — you can't put a key
directly in frontend code, anyone could steal it from the browser. `worker.js` in this folder is
a ready-to-go Cloudflare Worker that does exactly that job, and it's free.

### 1. Get an Anthropic API key
Go to [console.anthropic.com](https://console.anthropic.com) → API Keys → Create Key. Copy it.

### 2. Deploy the Worker (no CLI needed)
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → sign up free (no card required).
2. In the sidebar: **Workers & Pages** → **Create** → **Create Worker**.
3. Give it a name, e.g. `queen-brain` → **Deploy** (deploys a placeholder first).
4. Click **Edit code**. Delete everything in the editor and paste in the contents of `worker.js`.
5. Click **Deploy**.
6. Back on the Worker's page, go to **Settings → Variables and Secrets** → **Add** →
   - Name: `ANTHROPIC_API_KEY`
   - Value: (paste your key)
   - Type: **Secret** (this keeps it hidden, never exposed to visitors)
   - Save.
7. Copy your Worker's URL from the top of the page — it looks like
   `https://queen-brain.yourname.workers.dev`.

### 3. Point the app at your Worker
Open `src/App.jsx`, find this line near the top:
```js
const WORKER_URL = "PASTE_YOUR_WORKER_URL_HERE";
```
Replace the placeholder with your real Worker URL, save.

That's it — Queen's Command Console and Content Studio will now run through your own key.

## Local development
```bash
npm install
npm run dev
```

## Deploy the interface to Cloudflare Pages
1. Push this folder to a new GitHub repository.
2. Go to [Cloudflare Pages](https://pages.cloudflare.com) → **Create a project** → **Connect to Git**.
3. Select your repo.
4. Build settings:
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Build output directory: `dist`
5. Click **Save and Deploy**. You'll get a live `https://queen-dashboard.pages.dev` URL in about a minute.
6. (Optional) Add a custom domain for free under the project's **Custom domains** tab.

Every push to GitHub after this auto-redeploys. Same goes for the Worker — edit and redeploy
anytime from the Cloudflare dashboard.

