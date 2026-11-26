import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import AdminView from '@/views/Admin';

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  // Strictly enforce Developer-only access on the server
  if (user.role !== 'Developer') {
    redirect(user.role === 'Caller' ? '/app/leads' : '/app/overview');
  }

  return <AdminView />;
}
