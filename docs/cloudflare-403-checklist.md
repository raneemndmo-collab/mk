# Cloudflare 403 Troubleshooting Checklist — monthlykey.com

This checklist addresses intermittent 403 errors returned to non-browser requests (bots, curl, fetch, external tools) when Cloudflare sits in front of the Railway origin.

---

## 1. Bot Fight Mode (Most Likely Cause)

Bot Fight Mode automatically challenges or blocks requests that Cloudflare classifies as "automated." This is the most common reason for intermittent 403s to curl, fetch, and unknown bots.

### Steps

1. Log in to **Cloudflare Dashboard** → select the **monthlykey.com** zone.
2. Navigate to **Security** → **Bots**.
3. Locate **Bot Fight Mode** (free plan) or **Super Bot Fight Mode** (Pro+).
4. If **Bot Fight Mode** is **ON** → toggle it **OFF**.
5. If using **Super Bot Fight Mode** (Pro/Business/Enterprise):
   - Set **Definitely automated** to **Allow** (not Block or Challenge).
   - Set **Likely automated** to **Allow**.
   - Set **Verified bots** to **Allow** (this covers Googlebot, Bingbot, etc.).
   - Uncheck **"Block AI Scrapers and Crawlers"** if present.

### Why This Causes 403

Cloudflare fingerprints requests by TLS handshake, IP reputation, and header patterns. Requests from curl, python-requests, and similar tools lack browser-like TLS fingerprints and get classified as "definitely automated," triggering a 403 Forbidden or a JS challenge that non-browser clients cannot solve (which also manifests as a 403).

---

## 2. WAF Custom Rules

Custom WAF rules may have been created (manually or by a Cloudflare template) that block requests based on user-agent or other heuristics.

### Steps

1. Navigate to **Security** → **WAF** → **Custom rules** tab.
2. Review every rule in the list. Look for rules that:
   - Match on `http.user_agent` containing "bot", "curl", "python", "wget", "java", "go-http"
   - Match on `cf.bot_management.score` being below a threshold
   - Match on `not cf.client.bot` (i.e., "not a verified bot")
   - Have action set to **Block** or **Managed Challenge**
3. For any rule that matches the above patterns:
   - **Option A**: Delete the rule entirely.
   - **Option B**: Change the action from **Block** to **Log** to observe without blocking.
   - **Option C**: Add an exception: `and not http.request.uri.path contains "/api/"` to at least unblock API routes.

---

## 3. WAF Managed Rules (OWASP / Cloudflare Managed Ruleset)

Managed rulesets can sometimes flag legitimate requests.

### Steps

1. Navigate to **Security** → **WAF** → **Managed rules** tab.
2. Check if **Cloudflare Managed Ruleset** is deployed.
3. Check if **Cloudflare OWASP Core Ruleset** is deployed.
4. For each deployed ruleset, click the **three-dot menu** → **Edit**.
5. Look at the **Anomaly Score Threshold** (OWASP). If set below 25, raise it to **25** (the default).
6. Check individual rule overrides — look for any rule with action set to **Block** that mentions "User-Agent" or "Bot."

---

## 4. IP Access Rules

IP-based blocks can cause 403s for specific networks.

### Steps

1. Navigate to **Security** → **WAF** → **Tools** tab.
2. Review the **IP Access Rules** list.
3. Look for any rules with action **Block** or **Challenge** that target:
   - Broad CIDR ranges (e.g., entire cloud provider ranges like AWS, GCP, Railway)
   - Country-level blocks that might affect your users or monitoring tools
4. Remove or change to **Allow** any rules that are too broad.

---

## 5. Firewall Events Log (Diagnosis)

Use this to confirm which Cloudflare feature is actually returning the 403.

### Steps

1. Navigate to **Security** → **Events**.
2. Filter by:
   - **Action**: Block
   - **Time range**: Last 24 hours (or when the 403 was reported)
3. For each blocked request, check the **Service** column:
   - `bm` = Bot Management / Bot Fight Mode → fix via Step 1
   - `firewallCustom` = Custom WAF rule → fix via Step 2
   - `firewallManaged` = Managed ruleset → fix via Step 3
   - `ip` = IP Access Rule → fix via Step 4
4. Click on individual events to see the full request details (User-Agent, IP, ASN, TLS fingerprint, bot score).

---

## 6. Verified Bots Allowlist

Ensure Cloudflare's verified bot list is not accidentally restricted.

### Steps

1. Navigate to **Security** → **Bots** → **Configure Super Bot Fight Mode** (if on Pro+).
2. Ensure **Verified bots** is set to **Allow**.
3. This covers: Googlebot, Bingbot, Applebot, LinkedInBot, Twitterbot, facebookexternalhit, Slackbot, and other major crawlers.

---

## 7. Page Rules (Legacy)

Older Cloudflare setups may have Page Rules that affect security level.

### Steps

1. Navigate to **Rules** → **Page Rules**.
2. Look for any rule matching `monthlykey.com/*` with:
   - **Security Level** set to **I'm Under Attack** or **High**
   - **Browser Integrity Check** set to **On**
3. Change **Security Level** to **Medium** or **Low**.
4. Disable **Browser Integrity Check** if it is blocking legitimate tools.

---

## Quick Verification After Changes

Run these commands after making Cloudflare changes to confirm the fix:

```bash
# No user-agent (should return 200)
curl -s -o /dev/null -w "%{http_code}" https://monthlykey.com

# Default curl UA (should return 200)
curl -s -o /dev/null -w "%{http_code}" -A "curl/8.0" https://monthlykey.com

# Python requests UA (should return 200)
curl -s -o /dev/null -w "%{http_code}" -A "python-requests/2.31.0" https://monthlykey.com

# Googlebot (should return 200 with prerendered HTML)
curl -s -o /dev/null -w "%{http_code}" -A "Googlebot/2.1" https://monthlykey.com

# Real browser UA (should return 200)
curl -s -o /dev/null -w "%{http_code}" -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" https://monthlykey.com
```

All five should return `200`. If any returns `403`, check **Security → Events** in Cloudflare to identify which service blocked it.
