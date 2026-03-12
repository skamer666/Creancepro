import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { action, note, amount } = await req.json()
    const { id } = params

    const dossier = await prisma.dossier.findFirst({
      where: { id, company: { userId: session.user.id } },
    })
    if (!dossier) return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 })

    const performedBy = session.user.name || session.user.email || 'Système'

    let newStatus = dossier.status
    let actionData: any = { performedBy }

    switch (action) {
      case 'RAPPEL_1':
        newStatus = 'RAPPEL_1'
        actionData = {
          ...actionData,
          type: 'RAPPEL_1_ENVOYE',
          title: 'Rappel 1 envoyé',
          description: 'Premier rappel amiable envoyé au débiteur',
        }
        break
      case 'RAPPEL_2':
        newStatus = 'RAPPEL_2'
        actionData = {
          ...actionData,
          type: 'RAPPEL_2_ENVOYE',
          title: 'Rappel 2 envoyé',
          description: 'Deuxième rappel amiable envoyé au débiteur',
        }
        break
      case 'MED':
        newStatus = 'MISE_EN_DEMEURE'
        actionData = {
          ...actionData,
          type: 'MED_REDIGEE',
          title: 'Mise en demeure rédigée',
          description: 'Mise en demeure officielle rédigée',
        }
        break
      case 'BPOST':
        newStatus = 'BPOST_ENVOYE'
        actionData = {
          ...actionData,
          type: 'MED_ENVOYEE_BPOST',
          title: 'MED envoyée via bpost',
          description: 'Mise en demeure envoyée par courrier recommandé bpost',
        }
        break
      case 'PAYE':
        newStatus = 'PAYE'
        actionData = {
          ...actionData,
          type: 'PAIEMENT_COMPLET',
          title: 'Dossier marqué comme payé',
          description: 'Paiement complet reçu',
          amount: dossier.originalAmount,
        }
        break
      case 'NOTE':
        actionData = {
          ...actionData,
          type: 'NOTE_INTERNE',
          title: 'Note interne',
          description: note || '',
        }
        break
      default:
        return NextResponse.json({ error: 'Action inconnue' }, { status: 400 })
    }

    await prisma.$transaction([
      prisma.dossier.update({
        where: { id },
        data: {
          status: newStatus,
          paidAt: action === 'PAYE' ? new Date() : undefined,
          paidAmount: action === 'PAYE' ? dossier.originalAmount : undefined,
        },
      }),
      prisma.action.create({
        data: { dossierId: id, ...actionData },
      }),
    ])

    return NextResponse.json({ success: true, newStatus })
  } catch (error) {
    console.error('POST /api/dossiers/[id]/actions error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
