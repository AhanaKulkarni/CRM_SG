import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import AdminView from '@/views/Admin';

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  return <AdminView />;
}
