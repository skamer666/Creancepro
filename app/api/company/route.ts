import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const data = await req.json()

    const company = await prisma.company.findFirst({ where: { userId: session.user.id } })
    if (!company) return NextResponse.json({ error: 'Entreprise non trouvée' }, { status: 404 })

    const updated = await prisma.company.update({
      where: { id: company.id },
      data: {
        name: data.name || company.name,
        siret: data.siret || null,
        tva: data.tva || null,
        address: data.address || null,
        city: data.city || null,
        postalCode: data.postalCode || null,
        phone: data.phone || null,
        email: data.email || null,
        website: data.website || null,
        iban: data.iban || null,
        bic: data.bic || null,
        bpostApiKey: data.bpostApiKey || null,
        bpostAccountId: data.bpostAccountId || null,
      },
    })

    return NextResponse.json({ success: true, company: updated })
  } catch (error) {
    console.error('PUT /api/company error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
