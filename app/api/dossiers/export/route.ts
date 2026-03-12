import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatDate, getStatusLabel, getDaysOverdue } from '@/lib/utils'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const companyId = searchParams.get('companyId')

    if (!companyId) return NextResponse.json({ error: 'companyId requis' }, { status: 400 })

    const dossiers = await prisma.dossier.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    })

    const headers = [
      'Numéro', 'Débiteur', 'Email', 'Téléphone', 'Adresse', 'Ville', 'CP',
      'Type', 'N° Facture', 'Date Facture', 'Échéance', 'Montant', 'Payé',
      'Restant', 'Statut', 'Retard (jours)', 'Créé le',
    ]

    const rows = dossiers.map(d => [
      d.numero,
      d.debtorName,
      d.debtorEmail || '',
      d.debtorPhone || '',
      d.debtorAddress || '',
      d.debtorCity || '',
      d.debtorPostalCode || '',
      d.debtorType,
      d.invoiceNumber || '',
      d.invoiceDate ? formatDate(new Date(d.invoiceDate)) : '',
      formatDate(new Date(d.dueDate)),
      Number(d.originalAmount).toFixed(2),
      Number(d.paidAmount).toFixed(2),
      (Number(d.originalAmount) - Number(d.paidAmount)).toFixed(2),
      getStatusLabel(d.status),
      d.status !== 'PAYE' ? Math.max(0, getDaysOverdue(new Date(d.dueDate))).toString() : '0',
      formatDate(new Date(d.createdAt)),
    ])

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';')),
    ].join('\n')

    return new NextResponse('\uFEFF' + csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="dossiers-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('GET /api/dossiers/export error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
