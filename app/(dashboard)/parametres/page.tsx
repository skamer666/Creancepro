import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ParametresClient from './parametres-client'

export default async function ParametresPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')

  const [company, subscription] = await Promise.all([
    prisma.company.findFirst({ where: { userId: session.user.id } }),
    prisma.subscription.findUnique({ where: { userId: session.user.id } }),
  ])

  return (
    <ParametresClient
      company={company ? JSON.parse(JSON.stringify(company)) : null}
      subscription={subscription ? JSON.parse(JSON.stringify(subscription)) : null}
      userId={session.user.id}
    />
  )
}
