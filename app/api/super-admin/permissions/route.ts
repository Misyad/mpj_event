import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_PERMISSIONS, PERMISSION_LABELS } from '@/lib/auth/permissions'
import { listRolesWithPermissions, requireSuperAdmin } from '@/lib/server/rbac'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request)
    return NextResponse.json({
      ok: true,
      data: {
        permissions: ADMIN_PERMISSIONS.map((code) => ({
          code,
          label: PERMISSION_LABELS[code],
          module: code === '*' ? 'system' : code.split('.')[0],
        })),
        roles: await listRolesWithPermissions(),
      },
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 401 },
    )
  }
}
