import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create demo user
  const hashedPassword = await bcrypt.hash('password123', 12)

  const user = await prisma.user.upsert({
    where: { email: 'demo@creancepro.be' },
    update: {},
    create: {
      name: 'Jean Dupont',
      email: 'demo@creancepro.be',
      password: hashedPassword,
      companies: {
        create: {
          name: 'Dupont & Associés SPRL',
          tva: 'BE0123456789',
          siret: '0123.456.789',
          address: 'Rue de la Loi 42',
          city: 'Bruxelles',
          postalCode: '1000',
          country: 'BE',
          phone: '+32 2 123 45 67',
          email: 'contact@dupont-associes.be',
          iban: 'BE68 5390 0754 7034',
          bic: 'TRIOBEBB',
        },
      },
      subscription: {
        create: {
          plan: 'STARTER',
          status: 'ACTIVE',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    },
  })

  const company = await prisma.company.findFirst({ where: { userId: user.id } })
  if (!company) throw new Error('Company not found')

  // Create demo dossiers
  const dossiers = [
    {
      numero: 'DOS-2024-0001',
      status: 'RAPPEL_2' as const,
      debtorType: 'B2B' as const,
      debtorName: 'Tech Solutions SPRL',
      debtorEmail: 'finance@techsolutions.be',
      debtorPhone: '+32 2 456 78 90',
      debtorAddress: 'Avenue Louise 123',
      debtorCity: 'Bruxelles',
      debtorPostalCode: '1050',
      debtorVat: 'BE0987654321',
      invoiceNumber: 'FAC-2024-0042',
      invoiceDate: new Date('2024-06-01'),
      dueDate: new Date('2024-07-01'),
      originalAmount: 4850.00,
      paidAmount: 0,
    },
    {
      numero: 'DOS-2024-0002',
      status: 'MISE_EN_DEMEURE' as const,
      debtorType: 'B2B' as const,
      debtorName: 'Construction Léonard SA',
      debtorEmail: 'comptabilite@leonard.be',
      debtorAddress: 'Rue de Namur 8',
      debtorCity: 'Liège',
      debtorPostalCode: '4000',
      debtorVat: 'BE0456789123',
      invoiceNumber: 'FAC-2024-0031',
      invoiceDate: new Date('2024-05-15'),
      dueDate: new Date('2024-06-15'),
      originalAmount: 12400.00,
      paidAmount: 0,
    },
    {
      numero: 'DOS-2024-0003',
      status: 'RAPPEL_1' as const,
      debtorType: 'B2C' as const,
      debtorName: 'Martin, Sophie',
      debtorEmail: 'sophie.martin@gmail.com',
      debtorPhone: '+32 496 12 34 56',
      debtorAddress: 'Rue du Commerce 15',
      debtorCity: 'Gand',
      debtorPostalCode: '9000',
      invoiceNumber: 'FAC-2024-0055',
      invoiceDate: new Date('2024-08-01'),
      dueDate: new Date('2024-09-01'),
      originalAmount: 850.00,
      paidAmount: 0,
    },
    {
      numero: 'DOS-2024-0004',
      status: 'PAYE' as const,
      debtorType: 'B2B' as const,
      debtorName: 'Agence Web Creative SPRL',
      debtorEmail: 'admin@webcreative.be',
      debtorVat: 'BE0321654987',
      invoiceNumber: 'FAC-2024-0018',
      invoiceDate: new Date('2024-03-01'),
      dueDate: new Date('2024-04-01'),
      originalAmount: 2200.00,
      paidAmount: 2200.00,
      paidAt: new Date('2024-04-25'),
    },
    {
      numero: 'DOS-2024-0005',
      status: 'BPOST_ENVOYE' as const,
      debtorType: 'B2B' as const,
      debtorName: 'Imprimerie Durand & Fils',
      debtorEmail: 'info@durand-imprimerie.be',
      debtorAddress: 'Chaussée de Wavre 200',
      debtorCity: 'Bruxelles',
      debtorPostalCode: '1160',
      debtorVat: 'BE0654321789',
      invoiceNumber: 'FAC-2024-0067',
      invoiceDate: new Date('2024-07-01'),
      dueDate: new Date('2024-08-01'),
      originalAmount: 7650.00,
      paidAmount: 0,
    },
    {
      numero: 'DOS-2024-0006',
      status: 'NOUVEAU' as const,
      debtorType: 'B2B' as const,
      debtorName: 'Électricité Verbeke SPRL',
      debtorEmail: 'facturation@verbeke.be',
      debtorVat: 'BE0741852963',
      invoiceNumber: 'FAC-2024-0089',
      invoiceDate: new Date('2024-10-01'),
      dueDate: new Date('2024-11-01'),
      originalAmount: 3200.00,
      paidAmount: 0,
    },
  ]

  for (const d of dossiers) {
    await prisma.dossier.upsert({
      where: { numero: d.numero },
      update: {},
      create: {
        ...d,
        companyId: company.id,
        actions: {
          create: {
            type: 'CREATION',
            title: 'Dossier créé',
            description: `Dossier créé pour ${d.debtorName}`,
            performedBy: 'Jean Dupont',
          },
        },
      },
    })
  }

  // Add legal rates
  const rates = [
    { year: 2024, semester: 1, rate: 0.1300 },
    { year: 2024, semester: 2, rate: 0.1300 },
    { year: 2025, semester: 1, rate: 0.1200 },
    { year: 2025, semester: 2, rate: 0.1200 },
    { year: 2026, semester: 1, rate: 0.1150 },
  ]

  for (const r of rates) {
    await prisma.legalRate.upsert({
      where: { year_semester: { year: r.year, semester: r.semester } },
      update: {},
      create: r,
    })
  }

  console.log('✅ Seed complete!')
  console.log('📧 Login: demo@creancepro.be')
  console.log('🔑 Password: password123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
