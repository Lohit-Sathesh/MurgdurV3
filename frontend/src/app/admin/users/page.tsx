import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { UserRoleSelect } from '@/components/admin/UserRoleSelect'

interface AdminUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  createdAt: string
}

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions)
  let users: AdminUser[] = []
  try {
    const res = await api.get('/admin/users', {
      headers: { Authorization: `Bearer ${(session as any)?.accessToken}` }
    })
    users = res.data ?? []
  } catch {}

  return (
    <section>
      <h1 className="font-serif text-4xl tracking-luxury mb-10">Users</h1>
      {users.length === 0 ? (
        <p className="text-luxury-muted border border-luxury-gray p-8 text-center">No users found.</p>
      ) : (
        <div className="overflow-x-auto border border-luxury-gray">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-luxury-muted uppercase text-xs tracking-luxury border-b border-luxury-gray bg-luxury-white/[0.02]">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Joined</th>
                <th className="py-3 px-4">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-luxury-gray/50 last:border-0 hover:bg-luxury-white/[0.02] transition-colors">
                  <td className="py-3 px-4 text-luxury-white">{u.firstName} {u.lastName}</td>
                  <td className="py-3 px-4 text-luxury-muted">{u.email}</td>
                  <td className="py-3 px-4 text-luxury-muted">{formatDate(u.createdAt)}</td>
                  <td className="py-3 px-4">
                    <UserRoleSelect userId={u.id} role={u.role} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
