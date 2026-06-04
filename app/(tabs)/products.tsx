import { useEffect } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { useAuthContext } from '@/lib/auth-context';

export default function ProductsRedirect() {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace('/auth/login');
  }, [loading, router]);

  return <Redirect href="/auth/login" />;
}
