# UAT and Production Deployment Runbook

This runbook targets safe releases with explicit rollback and database protection.

## 1. Release Preparation

1. Cut release branch/tag and freeze schema-changing PR merges.
2. Build immutable artifacts:
   - backend container image: `registry/.../carnalysys-api:<release-tag>`
   - frontend static bundle for target environment.
3. Verify environment file/secret presence:
   - `SPRING_DATASOURCE_*`
   - `APP_JWT_SECRET`
   - `APP_PAYMENT_WEBHOOK_SECRET`
   - `APP_CORS_ALLOWED_ORIGINS`
4. Confirm monitoring and on-call owner for deployment window.

## 2. Database Safety (Mandatory)

1. Take database backup before deploy:
   - logical dump (`pg_dump`) and/or storage snapshot.
2. Validate backup completion and integrity.
3. Keep restore command and credentials ready.
4. Review Flyway migration scripts for:
   - forward-only migration
   - no destructive DDL in same release as app change unless planned maintenance.

## 3. UAT Deployment

1. Deploy backend:

```bash
CARNALYSYS_API_IMAGE=registry.example.com/carnalysys-api:<release-tag> \
docker compose -f docker-compose.app-uat.yml up -d
```

2. Deploy UAT frontend bundle.
3. Run smoke tests:
   - health endpoint
   - auth/login/refresh
   - browse/catalog/cart/order
   - payment webhook (if available in UAT).
4. Validate logs, metrics, DB health, and migration status.

## 4. Production Deployment

1. Reconfirm fresh DB backup/snapshot.
2. If migration requires write freeze, enable maintenance mode before backend rollout.
3. Deploy backend first:

```bash
CARNALYSYS_API_IMAGE=registry.example.com/carnalysys-api:<release-tag> \
docker compose -f docker-compose.app-prod.yml up -d
```

4. Confirm backend health and key API checks.
5. Deploy frontend production bundle.
6. Run production smoke tests and basic data integrity checks.

## 5. Rollback Without Data Loss

### App rollback (no schema incompatibility)

1. Re-deploy previous stable backend image tag.
2. Re-deploy previous stable frontend bundle.
3. Confirm health and smoke tests.

### DB migration issue / data risk

1. Stop write traffic (maintenance mode or ingress block).
2. Restore DB from pre-deploy snapshot/backup.
3. Deploy previous stable backend and frontend versions.
4. Validate data integrity and business-critical workflows before reopening writes.

## 6. Post-Deploy Monitoring (24-48h)

- Error rates and 5xx spikes
- Auth/session anomalies
- Payment/webhook failures and replay checks
- DB CPU/IO/latency and slow queries
- User-reported critical issues

## 7. Release Checklist (Sign-off)

- [ ] Backup/snapshot captured and verified
- [ ] UAT smoke tests passed
- [ ] Production smoke tests passed
- [ ] No unresolved P1/P2 errors
- [ ] Rollback artifacts documented and accessible
