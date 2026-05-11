'use client'

import { useState } from 'react'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Permission = {
  code: string
  label: string
  module: string
}

type RoleWithPermissions = {
  id: string
  code: string
  name: string
  description: string
  permissions: string[]
}

export function PermissionMatrix({ permissions, roles }: { permissions: Permission[]; roles: RoleWithPermissions[] }) {
  const [roleState, setRoleState] = useState(roles)
  const [message, setMessage] = useState('')

  function toggle(roleId: string, permission: string) {
    setRoleState((current) =>
      current.map((role) => {
        if (role.id !== roleId || role.code === 'super-admin') return role
        const hasPermission = role.permissions.includes(permission)
        return {
          ...role,
          permissions: hasPermission ? role.permissions.filter((item) => item !== permission) : [...role.permissions, permission],
        }
      }),
    )
  }

  async function save(role: RoleWithPermissions) {
    setMessage('')
    const response = await fetch(`/api/super-admin/roles/${role.id}/permissions`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ permissions: role.permissions }),
    })
    const payload = await response.json()
    setMessage(response.ok && payload.ok ? 'Permission berhasil disimpan.' : payload.error || 'Gagal menyimpan permission.')
  }

  return (
    <div className="space-y-4">
      {message ? (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
          {message}
        </div>
      ) : null}
      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-400">
            <tr>
              <th className="px-4 py-3">Permission</th>
              <th className="px-4 py-3">Module</th>
              {roleState.map((role) => (
                <th key={role.id} className="px-4 py-3">{role.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {permissions.map((permission) => (
              <tr key={permission.code} className="border-t border-gray-100">
                <td className="px-4 py-3 font-semibold text-[#1B4332]">{permission.label}</td>
                <td className="px-4 py-3 text-gray-500">{permission.module}</td>
                {roleState.map((role) => (
                  <td key={role.id} className="px-4 py-3">
                    <input
                      type="checkbox"
                      disabled={role.permissions.includes('*') || role.code === 'super-admin'}
                      checked={role.permissions.includes('*') || role.permissions.includes(permission.code)}
                      onChange={() => toggle(role.id, permission.code)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-2">
        {roleState.map((role) => (
          <Button key={role.id} onClick={() => save(role)} disabled={role.permissions.includes('*')} className="rounded-xl bg-[#1B4332] text-white">
            <Save className="h-4 w-4" />
            Simpan {role.name}
          </Button>
        ))}
      </div>
    </div>
  )
}
