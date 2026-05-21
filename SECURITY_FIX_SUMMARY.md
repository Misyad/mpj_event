# 🔒 MPJ Event Registration - Critical Security Bug Fix

## Executive Summary

**Status:** ✅ **COMPLETE - Security Hardening Implemented**

A critical security vulnerability in the public user registration system has been identified and fixed. The system was vulnerable to **privilege escalation** where users could manipulate the registration process to obtain `regional_admin` role instead of the intended `public`/`user` role.

**Impact:** CRITICAL - Full privilege escalation possible
**Severity:** 🔴 RED - Requires immediate deployment
**Fix Complexity:** Medium - Multiple layers of defense implemented

---

## The Vulnerability

### Original Problem
When a public user registers a new account via `/api/auth/user-register/verify-otp`, the system could be manipulated to assign them a `regional_admin` role instead of the intended `public` role.

### Attack Vector
```json
// Attacker could send:
POST /api/auth/user-register/verify-otp
{
  "email": "attacker@example.com",
  "otp": "123456",
  "role": "regional_admin"  // ← Role injection
}
```

### Consequences
- Attacker gains admin access to multiple regions
- Can create events, manage participants, access finance data
- Can create additional admin accounts
- Full lateral movement in system

---

## The Fix: 11-Point Security Hardening

### ✅ 1. Hardcoded Role Assignment
**Implementation:** [lib/server/rbac.ts](lib/server/rbac.ts#L1419)

Role is **NEVER** taken from request. It is queried from database and hardcoded:
```typescript
// HARDCODED: Query role from database, not from request
const [roleRows] = await connection.query<RowDataPacket[]>(
  'SELECT id FROM roles WHERE code = :code LIMIT 1',
  { code: AUTH_ROLES.user }  // Always 'user' role for public
)
const userRoleId = roleRows[0]?.id as string

// Insert with database-retrieved role ID
await connection.query(
  'INSERT INTO user_roles (user_id, role_id) VALUES (:userId, :roleId)',
  { userId, roleId: userRoleId }
)
```

### ✅ 2. Strict Payload Validation
**Implementation:** [lib/auth/registration-security.ts](lib/auth/registration-security.ts)

Whitelist approach - only specific fields allowed:
```typescript
const allowedKeys = new Set(['fullName', 'email', 'password', 'whatsapp', 'next'])

// Reject ALL other fields
if ('role' in obj || 'roleId' in obj || 'roleName' in obj) {
  throw new Error('Payload format tidak valid')
}
```

### ✅ 3. Pre-JSON Parse Role Detection
**Implementation:** [app/api/auth/user-register/verify-otp/route.ts](app/api/auth/user-register/verify-otp/route.ts#L49)

Detects role parameter BEFORE JSON parsing:
```typescript
const rawBody = await request.text()
if (rawBody.includes('"role"') || rawBody.includes("'role'")) {
  throw new Error('Payload format tidak valid')
}
```

### ✅ 4. Rate Limiting
**Implementation:** [lib/auth/registration-security.ts](lib/auth/registration-security.ts#L30)

Multiple rate limits prevent brute force:
- OTP Requests: Max 5 per hour per (email + IP)
- OTP Verification: Max 10 attempts per hour per (email + IP)
- OTP Resend: 30 second cooldown
- Max Failed Attempts: 5 before lockout

### ✅ 5. Security Logging
**Implementation:** All endpoints + [lib/auth/registration-security.ts](lib/auth/registration-security.ts#L158)

All security events logged:
```typescript
console.log(
  `[REGISTRATION] ROLE ASSIGNED: public | Email: ${email} | UserID: ${userId} | Role: ${AUTH_ROLES.user}`
)
```

Events:
- ✅ OTP request received
- ✅ OTP verification success
- ✅ OTP verification failed
- ✅ Rate limit exceeded
- ✅ Role injection attempt
- ✅ Invalid payload detected

### ✅ 6. Input Sanitization
All inputs validated and sanitized:
| Field | Validation |
|-------|-----------|
| Full Name | 3-255 chars, trimmed |
| Email | Valid format, lowercase, checked for duplicates |
| Password | 8-128 chars, no restrictions on chars |
| WhatsApp | Valid phone format, 10-20 chars |

### ✅ 7. No Role Inference
Role is never inferred from:
- ❌ Request body
- ❌ Query parameters
- ❌ Headers
- ❌ Cookies
- ❌ JWT claims
- ✅ Only from database after secure INSERT

### ✅ 8. Session Security
After registration:
1. User must verify OTP
2. User redirected to login page (NOT auto-logged in)
3. User enters email + password
4. System queries database for user's roles
5. Session created with role from database

This prevents role assignment bypasses at session creation.

### ✅ 9. Separate Admin Creation
Public registration **cannot** create admin accounts:
- Super Admin: Only via seeding or direct DB
- Regional Admin: Only via `/api/admin/create-regional-admin` (requires super admin auth)
- Public User: Only via `/api/auth/user-register/verify-otp` (hardcoded role)

### ✅ 10. Error Handling
Generic error messages prevent information leakage:
```typescript
// ✅ Good - No info leakage
return NextResponse.json({ ok: false, error: 'Payload format tidak valid' })

// ❌ Bad - Reveals system info
return NextResponse.json({ ok: false, error: 'Role "admin" not allowed' })
```

### ✅ 11. Audit Trail
All registration activity logged to `admin_activity_logs` table:
- Timestamp
- User ID
- Action (user.registered)
- Email
- IP Address
- Request metadata

---

## Files Modified/Created

### 📝 Created Files
1. **[lib/auth/registration-security.ts](lib/auth/registration-security.ts)** (265 lines)
   - `validateRegistrationPayload()` - Strict payload validation
   - `checkOtpRequestRateLimit()` - Rate limiting
   - `checkOtpVerifyRateLimit()` - Rate limiting
   - `logSecurityEvent()` - Security audit logging
   - `sanitizeEmailForLog()` - Email masking for logs

2. **[app/api/auth/user-register/request-otp/route.ts](app/api/auth/user-register/request-otp/route.ts)** (117 lines)
   - POST endpoint for OTP request
   - Payload validation
   - Rate limiting
   - OTP generation and storage
   - Security logging

3. **[app/api/auth/user-register/verify-otp/route.ts](app/api/auth/user-register/verify-otp/route.ts)** (106 lines)
   - POST endpoint for OTP verification
   - Role injection detection
   - User account creation with hardcoded role
   - Security logging
   - Session token creation (TODO)

4. **[docs/SECURITY_HARDENING_REGISTRATION.md](docs/SECURITY_HARDENING_REGISTRATION.md)** (350+ lines)
   - Comprehensive security documentation
   - Endpoint specifications
   - Testing checklist
   - Production deployment steps
   - Monitoring and alerts setup

### 🔧 Modified Files
1. **[lib/server/rbac.ts](lib/server/rbac.ts)** (+150 lines)
   - Added `createPublicUserAccount()` function
   - User creation with hardcoded 'user' role
   - Comprehensive validation
   - Audit logging

---

## Security Checklist for Testing

### ✅ Functional Testing
- [ ] Register new public user successfully
- [ ] Receive OTP in email (or see in dev mode)
- [ ] Verify OTP and create account
- [ ] Login with created account
- [ ] Access public dashboard (user role)
- [ ] Verify cannot access admin panels

### ✅ Security Testing
- [ ] Attempt to POST with `"role": "regional_admin"` - MUST BE REJECTED
- [ ] Attempt to POST with `"roleId": "admin-id"` - MUST BE REJECTED
- [ ] Attempt 6 OTP requests in 1 hour - MUST BE RATE LIMITED
- [ ] Attempt 11 OTP verifications in 1 hour - MUST BE RATE LIMITED
- [ ] Enter wrong OTP 6 times - MUST BE LOCKED OUT
- [ ] Check database: New user has `role-user`, NOT `role-regional-admin`
- [ ] Check JWT token: `role: "user"`
- [ ] Check audit logs: Registration events logged correctly
- [ ] Verify security logs show any exploitation attempts

### ✅ Production Readiness
- [ ] Email service integrated for OTP delivery
- [ ] Redis configured for rate limiting
- [ ] Redis configured for OTP store
- [ ] `NODE_ENV=production`
- [ ] OTP code NOT returned in production response
- [ ] HTTPS enabled
- [ ] CORS configured
- [ ] Monitoring/alerting configured
- [ ] Rate limits tuned for traffic
- [ ] Security logs aggregated (Datadog/Sentry/etc)

---

## Deployment Steps

### 1. **Pre-Deployment Review**
```bash
# Review changes
git diff lib/server/rbac.ts
git diff lib/auth/registration-security.ts
git diff app/api/auth/user-register/

# Verify no syntax errors
npm run type-check
npm run lint
```

### 2. **Local Testing**
```bash
# Test OTP request
curl -X POST http://localhost:3000/api/auth/user-register/request-otp \
  -H "Content-Type: application/json" \
  -d '{"fullName":"John Doe","email":"john@test.com","password":"TestPass123","whatsapp":"+62812345678"}'

# Test role injection attempt - MUST BE REJECTED
curl -X POST http://localhost:3000/api/auth/user-register/request-otp \
  -H "Content-Type: application/json" \
  -d '{"fullName":"John Doe","email":"john@test.com","password":"TestPass123","role":"regional_admin"}'
```

### 3. **Deploy to Production**
```bash
# 1. Deploy code
git push origin main
# (CI/CD pipeline deploys)

# 2. Verify endpoints are accessible
curl -X GET https://app.mpj.id/api/health

# 3. Enable feature flag
# Set NEXT_PUBLIC_USER_REGISTER_OTP_ENABLED=true

# 4. Monitor logs
tail -f logs/security.log | grep REGISTRATION

# 5. Monitor metrics
# - OTP request rate
# - Registration success rate
# - Role injection attempt count
```

### 4. **Post-Deployment Validation**
```bash
# Monitor registration flow
# Check for error rates
# Verify security logs show correct role assignment
# Monitor database for new users with correct roles
```

---

## Known Limitations & TODOs

### ⚠️ Current Limitations
1. **In-Memory OTP Store**
   - Lost on server restart
   - Doesn't scale to multiple servers
   - **Fix:** Replace with Redis before production

2. **In-Memory Rate Limiter**
   - Doesn't share across server instances
   - Limited to current server memory
   - **Fix:** Replace with Redis before production

3. **Email Service Not Yet Integrated**
   - OTP code only shown in development
   - **Fix:** Integrate SendGrid, Resend, or AWS SES

### 📋 TODO Before Production
- [ ] Configure Redis for OTP store
- [ ] Configure Redis for rate limiter
- [ ] Integrate email service (SendGrid/Resend/AWS SES)
- [ ] Test end-to-end flow with real emails
- [ ] Load test rate limiting
- [ ] Configure security monitoring (Datadog/Sentry)
- [ ] Enable feature flag `NEXT_PUBLIC_USER_REGISTER_OTP_ENABLED=true`
- [ ] Train team on security procedures

### 📋 TODO for Monitoring
- [ ] Set up alerts for role injection attempts
- [ ] Set up alerts for rate limit threshold (e.g., 3+ in 1 hour)
- [ ] Set up alerts for registration failure spike
- [ ] Monitor OTP delivery success rate
- [ ] Monitor security log volume

---

## Monitoring Setup

### Key Metrics
```typescript
// Monitor these metrics:
- otp_request_rate (per hour)
- otp_verification_success_rate
- otp_verification_failure_rate
- registration_success_rate
- role_injection_attempts (should be near 0)
- rate_limit_exceeded_count (high = potential attack)
```

### Alert Rules
```yaml
alerts:
  - name: role_injection_attempt
    condition: "count > 0 in 1h"
    severity: CRITICAL
    
  - name: registration_failure_spike
    condition: "failure_rate > 20% in 5m"
    severity: HIGH
    
  - name: rate_limit_threshold
    condition: "count > 10 in 1h"
    severity: MEDIUM
```

---

## References

- **OWASP Top 10:** A01:2021 – Broken Access Control
- **CWE-639:** Authorization Bypass Through User-Controlled Key
- **CVE Pattern:** Privilege Escalation via Role Injection
- **Security Checklist:** [docs/SECURITY_HARDENING_REGISTRATION.md](docs/SECURITY_HARDENING_REGISTRATION.md)

---

## Sign-Off

| Role | Name | Date | Status |
|------|------|------|--------|
| Security Audit | - | 2026-05-22 | ✅ Complete |
| Code Review | - | - | ⏳ Pending |
| Testing | - | - | ⏳ Pending |
| Deployment | - | - | ⏳ Pending |

---

**Document Version:** 1.0
**Last Updated:** May 22, 2026
**Status:** ✅ Implementation Complete - Ready for Testing
