# Plan Screen Checklist

Flag plans that include:

- destructive commands or broad deletion
- force push or history rewrite
- plaintext credentials/secrets
- curl/wget piped to shell
- unscoped sudo/admin changes
- system config changes
- cron/systemd/launchd changes
- external sends/posts/API writes
- disabling tests/lint/type checks
- permission/scope escalation
- broad file modifications without rollback

If flagged, ask for approval or run devil's advocate before proceeding.
