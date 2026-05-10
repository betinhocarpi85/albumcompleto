import { redirect } from 'next/navigation'
import { isAdminAuth } from '@/lib/admin-auth'
import AdminLogin from './AdminLogin'

export default async function AdminPage() {
  if (await isAdminAuth()) redirect('/admin/dashboard')
  return <AdminLogin />
}
