---
layout: layout.njk
title: "Monitoring and Backups"
description: "Configure analytics, alerts, and scheduled backups so site operations stay resilient."
intent: troubleshooting
tasks:
  - operations
  - observability
permalink: /docs/monitoring/
intentOrder: 1
---

# Monitoring and Backups

## GoatCounter Analytics
1. Create a counter at [GoatCounter](https://www.goatcounter.com/) for the domain you want to track.
2. In the deployment platform (e.g. Netlify) add an environment variable `GOATCOUNTER_DOMAIN` set to the GoatCounter host name (e.g. `democraticjustice.goatcounter.com`).
3. The site layout automatically embeds the GoatCounter script when `GOATCOUNTER_DOMAIN` is present, keeping credentials out of source control.

## Cloudflare Web Analytics
1. Create a site in [Cloudflare Web Analytics](https://www.cloudflare.com/web-analytics/).
2. Generate a beacon token and add it as the environment variable `CLOUDFLARE_ANALYTICS_TOKEN` in the deployment platform (e.g. Netlify).
3. The site layout automatically injects the Cloudflare beacon when the token is present.

## Microsoft Clarity
1. Create a project in [Microsoft Clarity](https://clarity.microsoft.com/). The Clarity dashboard shows the project ID in the **Settings → Setup** section.
2. Store the ID as the environment variable `MICROSOFT_CLARITY_PROJECT_ID` in your hosting platform rather than committing it to source control. For Netlify, run `netlify env:set MICROSOFT_CLARITY_PROJECT_ID <your-project-id>` or add the value via the Site settings UI.
3. Deployments automatically receive the environment variable and the layout embeds the Clarity loader whenever the ID is present, keeping the token out of source control.
4. The embedded loader defers to the official snippet from the Clarity dashboard and applies masked-session defaults by setting `mask`, `maskText`, and `maskImages` to `true`; override them by assigning `window.democraticJustice.claritySettings` before the loader runs (for example in a custom inline script). If you need extra tag attributes (for example a `nonce`), provide them through `window.democraticJustice.clarityScriptAttrs`.

## Alerts
- In the Cloudflare dashboard open **Analytics → Alerts**.
- Create notifications for request spikes or 5xx error rates according to your thresholds.
- Configure recipients such as email or Slack to receive the alert.

## Scheduled Backups
- The workflow at `.github/workflows/backup.yml` archives this repository on a daily schedule.
- Provide the following secrets so the workflow can upload the archive to external storage:
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `AWS_REGION`
  - `S3_BUCKET`
- Backups are uploaded to the specified S3 bucket and stored as workflow artifacts.
