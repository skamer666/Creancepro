import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDate } from '@/lib/utils'

// Generate a simple text-based PDF using basic encoding
// In production, use @react-pdf/renderer or puppeteer
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const fields = await req.json()
    const { id } = params

    const dossier = await prisma.dossier.findFirst({
      where: { id, company: { userId: session.user.id } },
      include: { company: true },
    })
    if (!dossier) return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 })

    const today = new Date()

    // Generate HTML for the MED (could be converted to PDF with puppeteer)
    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; font-size: 11pt; margin: 40px; color: #1a1a1a; }
  .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
  .sender { font-size: 10pt; color: #555; }
  .recipient { text-align: right; }
  .title { text-align: center; font-size: 16pt; font-weight: bold; text-transform: uppercase;
            border: 2px solid #cc0000; padding: 10px; margin: 30px 0; color: #cc0000; }
  .ref { font-size: 10pt; color: #555; margin-bottom: 20px; }
  .body { line-height: 1.6; }
  .amounts-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  .amounts-table td { padding: 8px; border-bottom: 1px solid #eee; }
  .amounts-table .label { color: #555; }
  .amounts-table .total { font-weight: bold; font-size: 12pt; border-top: 2px solid #333; }
  .footer { margin-top: 40px; font-size: 10pt; color: #555; }
  .legal { font-size: 8pt; color: #888; margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px; }
</style>
</head>
<body>
<div class="header">
  <div class="sender">
    <strong>${dossier.company.name}</strong><br>
    ${dossier.company.address || ''}<br>
    ${dossier.company.postalCode || ''} ${dossier.company.city || ''}<br>
    ${dossier.company.tva ? `TVA: ${dossier.company.tva}` : ''}
    ${dossier.company.email ? `<br>${dossier.company.email}` : ''}
  </div>
  <div class="recipient">
    <strong>${fields.recipientName}</strong><br>
    ${fields.recipientAddress}<br>
    ${fields.recipientCity}
    ${dossier.debtorVat ? `<br>TVA: ${dossier.debtorVat}` : ''}
  </div>
</div>

<div style="text-align:right; color: #555; font-size: 10pt; margin-bottom: 10px;">
  ${formatDate(today)}
</div>

<div class="title">MISE EN DEMEURE</div>
<div style="text-align:center; font-size:9pt; color:#888; margin-top:-20px; margin-bottom:20px;">
  Envoyée par courrier recommandé avec accusé de réception
</div>

<p>Madame, Monsieur,</p>

<p>Nonobstant nos relances précédentes, nous constatons que la facture
<strong>${fields.invoiceRef || dossier.invoiceNumber || 'N/A'}</strong>
${fields.invoiceDate ? `du ${formatDate(new Date(fields.invoiceDate))}` : ''},
échue le <strong>${formatDate(new Date(fields.dueDate))}</strong>,
demeure impayée à ce jour.</p>

<p>Par la présente, nous vous <strong>mettons en demeure</strong> de nous régler, dans un délai
de <strong>15 jours</strong> à compter de la réception de ce courrier, soit au plus tard le
<strong>${formatDate(new Date(fields.paymentDeadline))}</strong>,
la somme totale de <strong style="color: #cc0000;">${formatCurrency(parseFloat(fields.totalAmount))}</strong>,
se décomposant comme suit :</p>

<table class="amounts-table">
  <tr>
    <td class="label">Principal impayé</td>
    <td style="text-align:right;">${formatCurrency(parseFloat(fields.principalAmount))}</td>
  </tr>
  <tr>
    <td class="label">Intérêts légaux de retard</td>
    <td style="text-align:right;">+ ${formatCurrency(parseFloat(fields.interestAmount))}</td>
  </tr>
  <tr>
    <td class="label">Indemnité forfaitaire de recouvrement ${dossier.debtorType === 'B2B' ? '(art. 6 loi 02/08/2002)' : '(loi 04/05/2023)'}</td>
    <td style="text-align:right;">+ ${formatCurrency(parseFloat(fields.flatFeeAmount))}</td>
  </tr>
  <tr class="total">
    <td><strong>TOTAL RÉCLAMÉ</strong></td>
    <td style="text-align:right; color: #cc0000;"><strong>${formatCurrency(parseFloat(fields.totalAmount))}</strong></td>
  </tr>
</table>

<p>Ce paiement devra être effectué par virement bancaire sur notre compte :</p>
<p><strong>IBAN :</strong> ${dossier.company.iban || '___________________'} &nbsp; <strong>BIC :</strong> ${dossier.company.bic || '___________'}</p>
<p>Avec la mention obligatoire : <strong>${dossier.numero}</strong></p>

<p>À défaut de paiement dans le délai imparti, nous nous réservons le droit d'engager
toute procédure judiciaire à votre encontre, dont les frais et honoraires seront à votre
charge conformément aux dispositions légales applicables.</p>

<p>Nous espérons pouvoir résoudre cette situation à l'amiable et restons disponibles pour
tout arrangement de paiement raisonnable.</p>

<div class="footer">
  <p>Veuillez agréer, Madame, Monsieur, l'expression de nos salutations distinguées.</p>
  <br>
  <p><strong>${dossier.company.name}</strong></p>
</div>

<div class="legal">
  Ce document constitue une mise en demeure officielle conformément aux articles 1139 et suivants
  du Code civil belge. Les intérêts ont été calculés conformément à la loi du 2 août 2002
  concernant la lutte contre le retard de paiement dans les transactions commerciales (B2B)
  ou la loi du 4 mai 2023 (B2C). Dossier: ${dossier.numero}.
</div>
</body>
</html>`

    // Record MED action
    await prisma.$transaction([
      prisma.dossier.update({
        where: { id },
        data: { status: 'MISE_EN_DEMEURE' },
      }),
      prisma.action.create({
        data: {
          dossierId: id,
          type: 'MED_REDIGEE',
          title: 'Mise en demeure générée',
          description: `MED générée — Total: ${formatCurrency(parseFloat(fields.totalAmount))}`,
          performedBy: session.user.name || session.user.email || 'Système',
        },
      }),
      prisma.document.create({
        data: {
          dossierId: id,
          type: 'MISE_EN_DEMEURE',
          title: `Mise en demeure — ${dossier.debtorName}`,
          mimeType: 'text/html',
        },
      }),
    ])

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="MED-${dossier.numero}.html"`,
      },
    })
  } catch (error) {
    console.error('POST /api/dossiers/[id]/med error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
