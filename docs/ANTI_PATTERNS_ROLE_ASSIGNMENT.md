# ❌ What NOT To Do: Role Assignment Anti-Patterns

This document highlights dangerous practices to AVOID when handling role assignment in the registration system.

---

## ❌ DANGEROUS: Taking Role from Request Body

### The Vulnerable Code
```typescript
// ❌ DANGEROUS - DO NOT DO THIS
export async function registerUser(request: NextRequest) {
  const body = await request.json()
  
  // Role taken directly from user input
  const roleId = body.roleId || 'role-user'  // ← VULNERABLE!
  const userId = createUser({ roleId })
  
  // Result: User can POST with roleId: 'role-regional-admin'
}
```

### Why It's Dangerous
- User controls their own role assignment
- No validation that role exists
- No check if role is appropriate for registration type
- Complete privilege escalation vector

### ✅ The Safe Way
```typescript
// ✅ SAFE - Hardcode the role
export async function registerUser(request: NextRequest) {
  const body = await request.json()
  
  // Query database for the role ID, don't trust request
  const [roleRows] = await query(
    'SELECT id FROM roles WHERE code = :code LIMIT 1',
    { code: 'user' }  // Hardcoded, not from request
  )
  const roleId = roleRows[0]?.id
  
  const userId = createUser({ roleId })
}
```

---

## ❌ DANGEROUS: Role from Environment or Config

### The Vulnerable Code
```typescript
// ❌ DANGEROUS - Easy to mess up
const DEFAULT_ROLE = process.env.DEFAULT_USER_ROLE || 'regional_admin'

export async function registerUser(payload) {
  const roleId = await getRoleIdByCode(DEFAULT_ROLE)
  return createUser({ roleId })
}
```

### Why It's Dangerous
- Environment variable could be misconfigured
- Defaults to wrong role
- No type safety
- Easy to change in error

### ✅ The Safe Way
```typescript
// ✅ SAFE - Hardcoded constant
const PUBLIC_REGISTRATION_ROLE = 'user'  // Cannot be changed

export async function registerUser(payload) {
  const roleId = await getRoleIdByCode(PUBLIC_REGISTRATION_ROLE)
  return createUser({ roleId })
}
```

---

## ❌ DANGEROUS: Role Parameter in Query String

### The Vulnerable Code
```typescript
// ❌ DANGEROUS
POST /api/register?role=admin
{
  "email": "attacker@example.com"
}

export async function handleRegister(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const role = searchParams.get('role') || 'user'  // ← VULNERABLE!
  
  return registerUser({ role })
}
```

### Why It's Dangerous
- Easy to manipulate via URL
- Visible in browser history
- Visible in logs
- Easy to miss during code review

### ✅ The Safe Way
```typescript
// ✅ SAFE - No role parameter accepted
export async function handleRegister(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const redirect = searchParams.get('redirect')  // ← OK
  
  // Never accept 'role' in URL
  if (searchParams.has('role')) {
    throw new Error('Invalid request')
  }
  
  return registerUser({ redirect })
}
```

---

## ❌ DANGEROUS: Role from Form Hidden Field

### The Vulnerable Code (Frontend)
```html
<!-- ❌ DANGEROUS - Hidden but visible in HTML source -->
<form action="/api/register" method="POST">
  <input type="text" name="email" />
  <input type="password" name="password" />
  <input type="hidden" name="role" value="user" />
  <!-- Attacker can change to "regional_admin" -->
</form>
```

### Why It's Dangerous
- Hidden fields are NOT hidden from attacker
- Attacker just opens dev tools and modifies
- False sense of security
- Sends to server anyway

### ✅ The Safe Way
```typescript
// ✅ SAFE - No role sent from frontend at all
export function RegisterForm() {
  return (
    <form action="/api/register" method="POST">
      <input type="email" name="email" required />
      <input type="password" name="password" required />
      {/* NO role field - ever */}
      <button type="submit">Register</button>
    </form>
  )
}
```

---

## ❌ DANGEROUS: Role Stored in LocalStorage

### The Vulnerable Code
```typescript
// ❌ DANGEROUS - XSS can modify localStorage
if (user.role) {
  localStorage.setItem('userRole', user.role)
}

// Later, use local role
const role = localStorage.getItem('userRole')  // ← Attacker can modify!
```

### Why It's Dangerous
- XSS attack can modify localStorage
- Browser dev tools can change it
- Used for authorization decisions
- Easy privilege escalation

### ✅ The Safe Way
```typescript
// ✅ SAFE - Role only from HTTP-only cookie (set by server)
// Never trust client-side role data for authorization

// Get role from JWT in httpOnly cookie (set by server on login)
// Use this ONLY for UI purposes, never for authorization
const role = jwtPayload?.role  // From httpOnly cookie

// Authorization must happen on EVERY server request
// Don't trust client-side role for server decisions
```

---

## ❌ DANGEROUS: No Role Validation During Insertion

### The Vulnerable Code
```typescript
// ❌ DANGEROUS - No validation
export async function createUser(payload) {
  await query(
    `INSERT INTO users (id, name, email, role_id)
     VALUES (:id, :name, :email, :roleId)`,
    {
      id: payload.userId,
      name: payload.name,
      email: payload.email,
      roleId: payload.roleId  // ← No validation!
    }
  )
}
```

### Why It's Dangerous
- Invalid roleId accepted
- Foreign key constraint might not exist
- Role could be NULL
- No audit trail

### ✅ The Safe Way
```typescript
// ✅ SAFE - Validate role exists before insert
export async function createUser(payload) {
  // First verify role exists
  const [roles] = await query(
    'SELECT id FROM roles WHERE id = :roleId LIMIT 1',
    { roleId: payload.roleId }
  )
  if (!roles[0]) {
    throw new Error('Role tidak valid')
  }
  
  // Then insert
  const [result] = await query(
    `INSERT INTO user_roles (user_id, role_id)
     VALUES (:userId, :roleId)`,
    {
      userId: payload.userId,
      roleId: payload.roleId  // ← Already validated
    }
  )
}
```

---

## ❌ DANGEROUS: Role from JWT Without Verification

### The Vulnerable Code
```typescript
// ❌ DANGEROUS - Trust unverified JWT claim
export async function protectedRoute(request: NextRequest) {
  const token = extractToken(request)
  const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64'))
  
  const role = decoded.role  // ← NOT VERIFIED!
  
  // Use role for authorization
  if (role !== 'admin') return error()
}
```

### Why It's Dangerous
- JWT not verified with signature
- Attacker can forge JWT with any role
- Claims can be modified
- No validation of expiration

### ✅ The Safe Way
```typescript
// ✅ SAFE - Verify JWT, then query database
export async function protectedRoute(request: NextRequest) {
  const token = extractToken(request)
  
  // Verify signature
  const decoded = await verifyAccessToken(token)
  if (!decoded) throw new Error('Invalid token')
  
  // Don't trust role from JWT for authorization
  // Query database instead
  const roles = await getUserRolesFromDatabase(decoded.userId)
  
  // Use database role
  if (!roles.includes('admin')) return error()
}
```

---

## ❌ DANGEROUS: Multiple Roles Without Checking All

### The Vulnerable Code
```typescript
// ❌ DANGEROUS - Only checks first role
export async function loginUser(email: string, password: string) {
  const user = await getUser(email)
  if (!user) throw new Error('User not found')
  
  const roles = await getUserRoles(user.id)
  const role = roles[0]  // ← What if list is [regional_admin, user]?
  
  // Could be regional_admin even if should be user
}
```

### Why It's Dangerous
- Array might have multiple roles
- Taking first role could be wrong one
- No validation of which role is appropriate
- Silent privilege escalation

### ✅ The Safe Way
```typescript
// ✅ SAFE - Explicitly select correct role
export async function loginUser(email: string, password: string) {
  const user = await getUser(email)
  if (!user) throw new Error('User not found')
  
  const roles = await getUserRoles(user.id)
  
  // Explicit role selection based on registration type
  if (user.registration_type === 'public') {
    const role = roles.find(r => r === 'user')
    if (!role) throw new Error('User role missing')
    return { user, role }
  }
  
  // Different handling for admin users
  if (user.registration_type === 'admin') {
    const role = roles.find(r => r === 'regional_admin')
    if (!role) throw new Error('Admin role missing')
    return { user, role }
  }
}
```

---

## ❌ DANGEROUS: No Audit Logging

### The Vulnerable Code
```typescript
// ❌ DANGEROUS - No logging, no audit trail
export async function createPublicUser(payload) {
  const user = await createUser({
    email: payload.email,
    roleId: 'role-user'
  })
  return user
  // Where did this user come from? Why this role? No history.
}
```

### Why It's Dangerous
- Can't investigate privilege escalation
- No way to track who did what
- Compliance failures
- Debugging security issues impossible

### ✅ The Safe Way
```typescript
// ✅ SAFE - Comprehensive logging
export async function createPublicUser(payload, request: NextRequest) {
  const user = await createUser({
    email: payload.email,
    roleId: 'role-user'
  })
  
  // Log the action
  await logSecurityEvent({
    type: 'user.created',
    userId: user.id,
    email: user.email,
    role: 'user',
    ipAddress: getClientIp(request),
    timestamp: new Date(),
    source: 'public_registration'
  })
  
  return user
}
```

---

## ❌ DANGEROUS: Error Messages That Reveal System

### The Vulnerable Code
```typescript
// ❌ DANGEROUS - Reveals too much information
try {
  const role = await getRoleById(roleId)
  if (!role) {
    return { error: 'Role "regional_admin" does not exist' }  // ← INFO LEAK!
  }
} catch (error) {
  return { error: error.message }  // ← STACK TRACE LEAK!
}
```

### Why It's Dangerous
- Attacker learns valid role names
- Attacker learns valid roleIds
- System internals exposed
- Attack surface increased

### ✅ The Safe Way
```typescript
// ✅ SAFE - Generic error messages
try {
  const role = await getRoleById(roleId)
  if (!role) {
    return { error: 'Payload format tidak valid' }  // ← Generic
  }
} catch (error) {
  // Log real error internally
  console.error('[ERROR]', error)
  return { error: 'Permintaan gagal' }  // ← Generic to user
}
```

---

## ✅ The Correct Pattern: Complete Example

```typescript
// ✅ CORRECT - Follow this pattern for all role assignments

import { NextRequest, NextResponse } from 'next/server'
import { validateRegistrationPayload } from '@/lib/auth/registration-security'

export async function POST(request: NextRequest) {
  try {
    // 1. Validate payload - REJECT if role present
    const body = await request.json()
    const validation = validateRegistrationPayload(body)
    if (!validation.valid) {
      return NextResponse.json(
        { ok: false, error: 'Payload format tidak valid' },
        { status: 400 }
      )
    }

    const payload = validation.payload!

    // 2. Query for correct role from database
    const [roleRows] = await query(
      'SELECT id FROM roles WHERE code = :code LIMIT 1',
      { code: 'user' }  // Hardcoded - not from request!
    )
    const roleId = roleRows[0]?.id
    if (!roleId) {
      throw new Error('Role tidak ditemukan')
    }

    // 3. Create user with database-verified role
    const userId = randomUUID()
    await query(
      `INSERT INTO users (id, email, full_name, password_hash, status)
       VALUES (:userId, :email, :fullName, :passwordHash, 'active')`,
      { userId, ...payload }
    )

    // 4. Insert role - use verified roleId
    await query(
      `INSERT INTO user_roles (user_id, role_id) VALUES (:userId, :roleId)`,
      { userId, roleId }  // ← Database-verified, hardcoded
    )

    // 5. Log the action
    await logSecurityEvent({
      type: 'user.created',
      userId,
      email: payload.email,
      ipAddress: request.ip,
      role: 'user'
    })

    // 6. Return success
    return NextResponse.json({ ok: true })

  } catch (error) {
    // Always return generic error - never expose details
    console.error('[ERROR]', error)
    return NextResponse.json(
      { ok: false, error: 'Permintaan gagal' },
      { status: 400 }
    )
  }
}
```

---

## Checklist: Before Committing Role Assignment Code

- [ ] Role is NEVER taken from request body
- [ ] Role is NEVER taken from query parameters
- [ ] Role is NEVER taken from headers
- [ ] Role is hardcoded or retrieved from database
- [ ] Role existence verified before insertion
- [ ] No role parameters accepted by endpoint
- [ ] Generic error messages (no info leaks)
- [ ] Security event logged with IP address
- [ ] Audit trail includes user creation
- [ ] Tests include role injection attempts
- [ ] Code reviewed by security team
- [ ] No hidden fields in frontend forms
- [ ] Payload validation tests exist
- [ ] Rate limiting configured
- [ ] Monitoring alerts configured

---

**Remember:** 
> "Never trust the client. Always verify on the server. Always assume the user is trying to exploit the system."

---

**Last Updated:** May 22, 2026
**Document Type:** Security Guidelines
**Classification:** Internal - Development Team
