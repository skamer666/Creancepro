import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/providers'

export const metadata: Metadata = {
  title: 'CréancePro - Gestion de créances pour PME belges',
  description: 'Gérez vos créances impayées efficacement. Rappels automatiques, mises en demeure légales, procédures judiciaires.',
  keywords: 'créances, impayés, mises en demeure, recouvrement, PME, Belgique',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
