'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

function getUserIdFromCookie() {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)userId=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export default function TopBar() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    function updateUserId() {
      setUserId(getUserIdFromCookie());
    }
    updateUserId();
    window.addEventListener('visibilitychange', updateUserId);
    return () => window.removeEventListener('visibilitychange', updateUserId);
  }, []);

  return (
    <header className="w-full flex justify-between items-center gap-4 py-4 px-6 border-b bg-background min-h-[56px] z-20">
      {/* Título a la izquierda */}
      <motion.div
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="font-bold text-lg text-primary"
      >
        <Link href="/inicio" className="hover:underline">
          BillTracker
        </Link>
      </motion.div>
      {/* Botones a la derecha */}
      <div className="flex items-center gap-4">
        {userId ? (
          <>
            <motion.div
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <Button asChild variant="secondary">
                <Link href={`/perfil/${userId}`}>Perfil</Link>
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <Button
                variant="destructive"
                onClick={() => signOut({ callbackUrl: '/login' })}
              >
                Logout
              </Button>
            </motion.div>
          </>
        ) : (
          <div className="h-6" />
        )}
      </div>
    </header>
  );
}