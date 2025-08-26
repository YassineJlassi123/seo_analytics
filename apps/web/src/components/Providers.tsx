'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { Navbar } from './Navbar';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider afterSignInUrl="/dashboard" afterSignUpUrl="/dashboard">
        <Navbar />
        <main className="container mx-auto p-4">{children}</main>
    </ClerkProvider>
  );
}
