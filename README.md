# ASC‑OS Demo (Static SPA)

This is a lightweight, Cloudflare‑Pages‑ready front‑end to showcase an Autonomous Supply Chain OS:
- **Presenter Mode** guides a 6‑step exec story.
- **Knowledge Layer** shows policies and guardrail evaluations inline.
- **Governance gates** (GxP + autonomy threshold) visibly block/allow actions.
- **ASC Data Model** tile links contracts → entities → agents.
- **Connectors** and **Agent Gallery** tiles signal “100 agents / 100 connectors” ambition.
- **AI‑Refinery pack export** included.

## Deploy on Cloudflare Pages
1. Create a new Pages project → **Direct Upload** or **Git**.
2. If Git: repo root should contain `index.html`, `style.css`, and `app.js` (no build).
3. **Build command**: *None* (static)  
   **Build output directory**: `/`  
   **Framework preset**: *None*
4. Ensure your project points to the folder with `index.html`. If you see the browser download a text file, you likely uploaded `index.html` with wrong MIME or nested it incorrectly—put it at repo root.

## Local preview
Just open `index.html` in a browser. No backend required.
