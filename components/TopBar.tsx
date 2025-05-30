'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

function getUserIdFromCookie() {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)userId=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export default function TopBar() {
  const [userId, setUserId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function updateUserId() {
      setUserId(getUserIdFromCookie());
    }
    updateUserId();
    window.addEventListener('visibilitychange', updateUserId);
    return () => window.removeEventListener('visibilitychange', updateUserId);
  }, []);

  // Cierra el menú al navegar
  function handleMenuClick() {
    setMenuOpen(false);
  }

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

      {/* Desktop menu */}
      <nav className="hidden sm:flex items-center gap-6">
        <Link href="/dashboard" className="hover:underline">
          Dashboard
        </Link>
        {userId && (
          <Button asChild variant="secondary">
            <Link href={`/perfil/${userId}`}>Perfil</Link>
          </Button>
        )}
        {userId && (
          <Button
            variant="destructive"
            onClick={() => signOut({ callbackUrl: '/login' })}
          >
            Logout
          </Button>
        )}
      </nav>

      {/* Mobile menu button */}
      <div className="sm:hidden flex items-center">
        <button
          aria-label="Abrir menú"
          className="p-2 rounded hover:bg-accent focus:outline-none"
          onClick={() => setMenuOpen((v) => !v)}
        >
          {/* Hamburguesa */}
          <svg width={28} height={28} fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" d="M5 8h18M5 14h18M5 20h18" />
          </svg>
        </button>
        {/* Menú desplegable */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-16 right-4 bg-white border rounded shadow-lg z-50 min-w-[160px] flex flex-col"
            >
              <Link
                href="/dashboard"
                className="px-4 py-2 hover:bg-accent"
                onClick={handleMenuClick}
              >
                Dashboard
              </Link>
              {userId && (
                <Link
                  href={`/perfil/${userId}`}
                  className="px-4 py-2 hover:bg-accent"
                  onClick={handleMenuClick}
                >
                  Perfil
                </Link>
              )}
              {userId && (
                <button
                  className="px-4 py-2 text-left hover:bg-accent text-red-600"
                  onClick={() => {
                    setMenuOpen(false);
                    signOut({ callbackUrl: '/login' });
                  }}
                >
                  Logout
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}