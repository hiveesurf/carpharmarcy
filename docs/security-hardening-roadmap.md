# Security Hardening Roadmap

This roadmap prioritizes controls that reduce MITM risk and production exposure first.

## Phase 0 (immediate, before public UAT/prod)

1. Enforce HTTPS-only at edge (redirect all HTTP to HTTPS).
2. Enable HSTS (`max-age>=31536000`, include subdomains when ready, preload only after verification).
3. Add baseline response headers:
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY` (or CSP `frame-ancestors 'none'`)
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - strict `Content-Security-Policy` for frontend assets.
4. Require strong runtime secrets for JWT and webhook verification.
5. Keep strict CORS allowlists per environment (no wildcard origins).
6. Add rate limiting for auth and OTP endpoints.

## Phase 1 (short-term)

1. Introduce signing key rotation process for JWT and other secrets.
2. Add replay protection for sensitive endpoints (idempotency key + timestamp tolerance).
3. Add dependency and image vulnerability scanning to CI/CD gate.
4. Add security-focused audit logging and alerting (auth failures, admin actions, webhook anomalies).

## Phase 2 (defense in depth)

1. Use mTLS for service-to-service traffic where supported.
2. Enforce TLS from app to database and least-privilege DB roles.
3. Run scheduled security reviews and incident-response drills.

## Verification Checklist

- HTTPS and certificate chain validated for UAT/prod domains.
- CORS policies validated by automated API tests.
- No plaintext secrets in repository.
- Security logs are forwarded and alerting is active.
