import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateDossierNumber } from '@/lib/utils'
import { differenceInDays } from 'date-fns'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const companyId = searchParams.get('companyId')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const delayCategory = searchParams.get('delayCategory') || ''
    const amountRange = searchParams.get('amountRange') || ''
    const sortBy = searchParams.get('sortBy') || 'updatedAt'
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!companyId) return NextResponse.json({ error: 'companyId requis' }, { status: 400 })

    // Build where clause
    const where: any = { companyId }

    if (search) {
      where.OR = [
        { debtorName: { contains: search, mode: 'insensitive' } },
        { numero: { contains: search, mode: 'insensitive' } },
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { debtorEmail: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status) where.status = status

    // Amount range filter
    if (amountRange) {
      const amountWhere: any = {}
      if (amountRange === 'lt1000') amountWhere.lt = 1000
      else if (amountRange === '1000-5000') { amountWhere.gte = 1000; amountWhere.lt = 5000 }
      else if (amountRange === '5000-20000') { amountWhere.gte = 5000; amountWhere.lt = 20000 }
      else if (amountRange === 'gt20000') amountWhere.gte = 20000
      if (Object.keys(amountWhere).length) where.originalAmount = amountWhere
    }

    const allowedSort = ['numero', 'debtorName', 'originalAmount', 'dueDate', 'status', 'updatedAt']
    const safeSortBy = allowedSort.includes(sortBy) ? sortBy : 'updatedAt'

    const [allDossiers, total] = await Promise.all([
      prisma.dossier.findMany({
        where,
        orderBy: { [safeSortBy]: sortOrder },
        select: {
          id: true,
          numero: true,
          status: true,
          debtorName: true,
          debtorEmail: true,
          originalAmount: true,
          paidAmount: true,
          dueDate: true,
          invoiceNumber: true,
          debtorType: true,
          updatedAt: true,
        },
      }),
      prisma.dossier.count({ where }),
    ])

    const now = new Date()

    // Filter by delay category after fetch (computed field)
    let filtered = allDossiers
    if (delayCategory) {
      filtered = allDossiers.filter(d => {
        const days = differenceInDays(now, new Date(d.dueDate))
        if (delayCategory === 'lt30') return days > 0 && days <= 30
        if (delayCategory === 'lt60') return days > 30 && days <= 60
        if (delayCategory === 'lt90') return days > 60 && days <= 90
        if (delayCategory === 'gt90') return days > 90
        return true
      })
    }

    // Pagination
    const paginated = filtered.slice((page - 1) * limit, page * limit)

    // Summary
    const totalAmount = filtered.reduce((s, d) => s + (Number(d.originalAmount) - Number(d.paidAmount)), 0)
    const delays = filtered
      .filter(d => d.status !== 'PAYE')
      .map(d => Math.max(0, differenceInDays(now, new Date(d.dueDate))))
    const avgDelay = delays.length > 0 ? delays.reduce((a, b) => a + b, 0) / delays.length : 0
    const actionRequired = filtered.filter(d => {
      const days = differenceInDays(now, new Date(d.dueDate))
      return days > 30 && d.status !== 'PAYE' && d.status !== 'ABANDONNE'
    }).length

    return NextResponse.json({
      dossiers: paginated,
      total: filtered.length,
      summary: { totalAmount, avgDelay, actionRequired },
    })
  } catch (error) {
    console.error('GET /api/dossiers error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await req.json()
    const {
      companyId,
      debtorName,
      debtorEmail,
      debtorPhone,
      debtorAddress,
      debtorCity,
      debtorPostalCode,
      debtorVat,
      debtorType,
      invoiceNumber,
      invoiceDate,
      dueDate,
      originalAmount,
      currency,
      description,
      internalRef,
    } = body

    if (!companyId || !debtorName || !dueDate || !originalAmount) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    }

    // Verify company ownership
    const company = await prisma.company.findFirst({
      where: { id: companyId, userId: session.user.id },
    })
    if (!company) return NextResponse.json({ error: 'Entreprise non trouvée' }, { status: 404 })

    // Generate unique number
    const count = await prisma.dossier.count({ where: { companyId } })
    const numero = generateDossierNumber(count + 1)

    const dossier = await prisma.dossier.create({
      data: {
        companyId,
        numero,
        debtorName,
        debtorEmail: debtorEmail || null,
        debtorPhone: debtorPhone || null,
        debtorAddress: debtorAddress || null,
        debtorCity: debtorCity || null,
        debtorPostalCode: debtorPostalCode || null,
        debtorVat: debtorVat || null,
        debtorType: debtorType || 'B2B',
        invoiceNumber: invoiceNumber || null,
        invoiceDate: invoiceDate ? new Date(invoiceDate) : null,
        dueDate: new Date(dueDate),
        originalAmount,
        currency: currency || 'EUR',
        description: description || null,
        internalRef: internalRef || null,
        actions: {
          create: {
            type: 'CREATION',
            title: 'Dossier créé',
            description: `Dossier créé pour ${debtorName} — Montant: ${originalAmount}€`,
            performedBy: session.user.name || session.user.email || 'Système',
          },
        },
      },
    })

    return NextResponse.json({ id: dossier.id, numero: dossier.numero }, { status: 201 })
  } catch (error) {
    console.error('POST /api/dossiers error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
