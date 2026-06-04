import { useEffect } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { useAuthContext } from '@/lib/auth-context';

export default function HomeRedirect() {
  const { user, userRole, userStatus, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/auth/login');
      return;
    }

    if (userStatus === 'pending') {
      router.replace('/auth/pending');
      return;
    }

    if (userRole === 'admin') {
      router.replace('/admin-dashboard');
      return;
    }

    router.replace('/staff-dashboard');
  }, [loading, router, user, userRole, userStatus]);

  return <Redirect href="/auth/login" />;
}
