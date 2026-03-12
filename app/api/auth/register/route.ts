import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { generateDossierNumber } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, companyName } = await req.json()

    if (!email || !password || !companyName) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 8 caractères' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Un compte existe déjà avec cet email' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        companies: {
          create: {
            name: companyName,
            country: 'BE',
          },
        },
        subscription: {
          create: {
            plan: 'FREE',
            status: 'TRIALING',
          },
        },
      },
    })

    return NextResponse.json({ success: true, userId: user.id })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
