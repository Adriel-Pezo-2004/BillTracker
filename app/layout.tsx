import './globals.css';
import type { ReactNode } from 'react';
import ClientLayout from './ClientLayout';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}