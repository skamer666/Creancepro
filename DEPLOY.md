# Déploiement CréancePro sur Vercel

## Prérequis
- Compte GitHub avec le repo CréancePro
- Compte Vercel (gratuit sur vercel.com)
- Node.js installé localement

---

## Étape 1 — Installer Vercel CLI

```bash
npm install -g vercel
```

---

## Étape 2 — Connexion à Vercel

```bash
vercel login
```

Suivre les instructions (connexion via GitHub recommandée).

---

## Étape 3 — Créer la base de données Postgres sur Vercel

1. Aller sur [vercel.com/dashboard](https://vercel.com/dashboard)
2. Cliquer sur **Storage** → **Create Database** → **Postgres**
3. Nommer la base : `creancepro-db`
4. Région : **Frankfurt (fra1)** (proche Belgique)
5. Cliquer **Create**
6. Dans l'onglet **Connect**, copier la `DATABASE_URL` (format `postgres://...`)

---

## Étape 4 — Déployer le projet

Dans le dossier du projet :

```bash
vercel
```

Répondre aux questions :
- **Set up and deploy?** → `Y`
- **Which scope?** → Ton compte
- **Link to existing project?** → `N` (première fois)
- **Project name?** → `creancepro`
- **Directory?** → `./` (laisser vide)

---

## Étape 5 — Configurer les variables d'environnement

Dans le dashboard Vercel → ton projet → **Settings** → **Environment Variables**, ajouter :

| Variable | Valeur |
|----------|--------|
| `DATABASE_URL` | URL Postgres Vercel (étape 3) |
| `NEXTAUTH_URL` | `https://ton-projet.vercel.app` |
| `NEXTAUTH_SECRET` | Générer avec `openssl rand -base64 32` |
| `STRIPE_SECRET_KEY` | Clé Stripe |
| `STRIPE_PUBLISHABLE_KEY` | Clé publique Stripe |
| `STRIPE_WEBHOOK_SECRET` | Secret webhook Stripe |
| `STRIPE_PRICE_ID_STARTER` | ID prix Starter |
| `STRIPE_PRICE_ID_PRO` | ID prix Pro |
| `RESEND_API_KEY` | Clé API Resend |
| `EMAIL_FROM` | `CréancePro <noreply@creancepro.be>` |
| `NEXT_PUBLIC_APP_URL` | `https://ton-projet.vercel.app` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clé publique Stripe |

---

## Étape 6 — Connecter GitHub pour l'auto-déploiement

### Option A : Via le dashboard Vercel (recommandé, le plus simple)

1. Vercel Dashboard → **Settings** → **Git**
2. **Connect Git Repository** → Sélectionner ton repo GitHub
3. **Production Branch** : `main`
4. ✅ **Désormais, chaque `git push` sur `main` = déploiement automatique**

### Option B : Via GitHub Actions (déjà configuré dans `.github/workflows/deploy.yml`)

Ajouter ces secrets dans GitHub → **Settings** → **Secrets** → **Actions** :
- `VERCEL_TOKEN` : Vercel Dashboard → Settings → Tokens → Create
- `VERCEL_ORG_ID` : Trouvé dans `.vercel/project.json` après `vercel link`
- `VERCEL_PROJECT_ID` : Trouvé dans `.vercel/project.json` après `vercel link`

---

## Étape 7 — Migrer la base de données

Après le premier déploiement, exécuter les migrations :

```bash
# Avec la DATABASE_URL de production
DATABASE_URL="postgres://..." npx prisma migrate deploy
```

Ou directement depuis Vercel en ajoutant temporairement à `package.json` :
```json
"build": "prisma migrate deploy && prisma generate && next build"
```
(C'est déjà configuré dans `vercel.json`)

---

## Étape 8 — Vérifier le déploiement

```bash
vercel --prod
```

L'URL de production sera du type : `https://creancepro.vercel.app`

---

## Workflow quotidien (après configuration)

```bash
# Modifier le code
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push origin main
# → Vercel détecte le push et redéploie automatiquement (~2 min)
```

---

## Commandes utiles

```bash
vercel logs                    # Voir les logs de production
vercel env pull .env.local     # Synchroniser les variables d'environnement
vercel --prod                  # Forcer un redéploiement
```

---

## Domaine personnalisé (optionnel)

Vercel Dashboard → **Settings** → **Domains** → Ajouter `creancepro.be`
Configurer les DNS chez ton registrar pour pointer vers Vercel.
