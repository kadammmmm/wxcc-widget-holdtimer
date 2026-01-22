# WXCC Widget Template

A starter template for building Webex Contact Center Agent Desktop widgets using Lit (Web Components), TypeScript, and Vite.

## 🚀 Quick Start

### 1. Create Your Repo

**Option A: Use as Template (Recommended)**
- Click "Use this template" on GitHub
- Name your new repo (e.g., `wxcc-my-widget`)
- Clone your new repo

**Option B: Clone and Rename**
```bash
git clone https://github.com/YOUR_USERNAME/wxcc-widget-template.git wxcc-my-widget
cd wxcc-my-widget
rm -rf .git
git init
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Rename Your Widget

1. Rename the TypeScript file:
   ```
   src/wxcc-widget-template.ts  →  src/my-widget.ts
   ```

2. Update the class name inside the file:
   ```typescript
   export class MyWidget extends LitElement {
   ```

3. Update the custom element name at the bottom:
   ```typescript
   customElements.define('my-widget', MyWidget);
   ```

4. Update `vite.config.ts`:
   ```typescript
   entry: './src/my-widget.ts',
   name: 'MyWidget',
   ```

### 4. Build

```bash
npm run build
```

### 5. Deploy to GitHub Pages

```bash
# Initial setup (one time)
git add .
git commit -m "Initial commit"
git push origin main

# Create gh-pages branch
git checkout -b gh-pages
cp dist/index.js .
git add index.js
git commit -m "Initial deployment"
git push origin gh-pages
git checkout main

# Enable GitHub Pages in repo settings (Settings → Pages → gh-pages branch)
```

---

## 📁 Project Structure

```
wxcc-widget-template/
├── src/
│   └── wxcc-widget-template.ts   # Main widget code (rename this)
├── dist/
│   └── index.js                  # Built widget (generated)
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript config
├── vite.config.ts                # Build configuration
├── deploy.sh                     # Deployment helper script
└── README.md
```

---

## 🔧 Agent Desktop Configuration

Add your widget to the desktop layout JSON:

### Header Widget (Always Visible)

```json
{
  "comp": "my-widget",
  "script": "https://YOUR_USERNAME.github.io/YOUR_REPO/index.js",
  "attributes": {
    "refresh-interval": "30000"
  }
}
```

### Tab Panel Widget

```json
{
  "comp": "md-tab",
  "attributes": { "slot": "tab" },
  "children": [
    { "comp": "span", "textContent": "My Widget" }
  ]
},
{
  "comp": "md-tab-panel",
  "attributes": { "slot": "panel" },
  "children": [
    {
      "comp": "my-widget",
      "script": "https://YOUR_USERNAME.github.io/YOUR_REPO/index.js"
    }
  ]
}
```

---

## 📡 API Reference

### Properties Passed by Agent Desktop

These are automatically available in your widget:

| Property | Type | Description |
|----------|------|-------------|
| `token` | string | Bearer token for API calls |
| `orgId` | string | Organization ID |
| `agentId` | string | Current agent's ID |
| `teamId` | string | Current agent's team ID |

### Search API Endpoint

```
POST https://api.wxcc-us1.cisco.com/search
```

**Regional Endpoints:**
| Region | URL |
|--------|-----|
| US | `api.wxcc-us1.cisco.com` |
| EU | `api.wxcc-eu1.cisco.com` |
| ANZ | `api.wxcc-anz1.cisco.com` |

---

## 📊 GraphQL Query Examples

### ⚠️ Important: Lessons Learned

1. **Use inline values, NOT variables** for aggregations
2. **Don't quote enum values** like `count`, `min`, `max`, `average`, `sum`
3. **Use `aggregations`** (plural), not `aggregation`

### Query: Task Aggregations

```graphql
{
  task(
    from: 1234567890000
    to: 1234567890000
    filter: {
      and: [
        { isActive: { equals: true } }
        { status: { equals: "parked" } }
      ]
    }
    aggregations: [
      { field: "id", type: count, name: "totalContacts" }
      { field: "createdTime", type: min, name: "oldestContact" }
    ]
  ) {
    tasks {
      lastQueue { id name }
      aggregation { name value }
    }
  }
}
```

### Query: Task List (No Aggregation)

```graphql
{
  task(
    from: 1234567890000
    to: 1234567890000
    filter: {
      isActive: { equals: true }
    }
  ) {
    tasks {
      id
      status
      channelType
      origin
      createdTime
      lastQueue { id name }
      owner { id name }
    }
  }
}
```

### Query: Agent Sessions

```graphql
{
  agentSession(
    from: 1234567890000
    to: 1234567890000
    filter: {
      isActive: { equals: true }
    }
  ) {
    agentSessions {
      agentId
      state
      teamId
      channelId
    }
  }
}
```

### Aggregation Types

| Type | Description |
|------|-------------|
| `count` | Count of records |
| `sum` | Sum of numeric field |
| `min` | Minimum value |
| `max` | Maximum value |
| `average` | Average value |

---

## 🔄 Deployment Workflow

After making changes:

```bash
# 1. Commit on main
git checkout main
git add .
git commit -m "Your changes"
git push origin main

# 2. Build
npm run build

# 3. Deploy to gh-pages  
git checkout gh-pages
cp dist/index.js .
git add index.js
git commit -m "Deploy update"
git push origin gh-pages

# 4. Return to main
git checkout main
```

Or use the helper script:
```bash
./deploy.sh "Your commit message"
```

---

## 🐛 Troubleshooting

### Widget Not Loading

1. Check browser console (F12) for errors
2. Verify script URL is accessible
3. Ensure HTTPS is used
4. Check GitHub Pages is enabled

### GraphQL Errors

- `Unknown type 'TaskAggregation'` → Use inline aggregations, not variables
- `Validation error` → Check query syntax, ensure enums aren't quoted

### TypeScript Errors

- `'variable' is declared but never used` → Use `[, value]` destructuring
- Always run `npm run build` to check for errors before deploying

### Git Issues

- `Updates rejected` → Run `git pull origin main` first
- `Uncommitted changes` → Commit or stash before switching branches

---

## 📚 Resources

- [Webex CC Developer Portal](https://developer.webex-cx.com)
- [Lit Documentation](https://lit.dev)
- [Webex CC API Samples](https://github.com/WebexSamples/webex-contact-center-api-samples)
- [Cisco Developer Community](https://community.cisco.com/t5/webex-for-developers/bd-p/disc-webex-developers)

---

## 📄 License

MIT License - Feel free to use this template for your projects!
