# Monitoring and Backups

## GoatCounter Analytics
1. Create a counter at [GoatCounter](https://www.goatcounter.com/) for the domain you want to track.
2. In the deployment platform (e.g. Netlify) add an environment variable `GOATCOUNTER_DOMAIN` set to the GoatCounter host name (e.g. `democraticjustice.goatcounter.com`).
3. The site layout automatically embeds the GoatCounter script when `GOATCOUNTER_DOMAIN` is present, keeping credentials out of source control.

## Cloudflare Web Analytics
1. Create a site in [Cloudflare Web Analytics](https://www.cloudflare.com/web-analytics/).
2. Generate a beacon token and add it as the environment variable `CLOUDFLARE_ANALYTICS_TOKEN` in the deployment platform (e.g. Netlify).
3. The site layout automatically injects the Cloudflare beacon when the token is present.

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
