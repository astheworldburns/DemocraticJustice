# Monitoring and Backups

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
