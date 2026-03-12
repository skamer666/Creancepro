import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import MiseEnDemeureEditor from './med-editor'

export default async function MiseEnDemeurePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')

  const dossier = await prisma.dossier.findFirst({
    where: {
      id: params.id,
      company: { userId: session.user.id },
    },
    include: { company: true },
  })

  if (!dossier) notFound()

  return <MiseEnDemeureEditor dossier={JSON.parse(JSON.stringify(dossier))} />
}
