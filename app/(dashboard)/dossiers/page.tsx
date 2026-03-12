import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import DossiersClient from './dossiers-client'

export default async function DossiersPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const company = await prisma.company.findFirst({
    where: { userId: session.user.id },
  })

  return <DossiersClient companyId={company?.id || ''} />
}
