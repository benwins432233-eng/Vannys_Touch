# Vannys Touch — E-Commerce TypeScript

Application e-commerce full-stack TypeScript. Backend NestJS sur Render, frontend React sur Vercel.

## Stack

| Couche | Technologie |
|--------|-------------|
| Backend | NestJS 10 · TypeScript 5.4 · Prisma 5.16 · PostgreSQL |
| Frontend | React 18 · TypeScript 5.5 · Vite 5 · Tailwind CSS 3 |
| Auth | JWT access (15min) + refresh token (7j), hashé en base |
| Emails | Resend API (transactionnel, pas de serveur SMTP) |
| Fichiers | Cloudinary SDK v1 |
| State | Zustand (auth persistée + panier persisté) |
| Fetching | React Query 5 |
| Runtime | Node 20 (verrouillé via `engines` + `.nvmrc`) |

## Structure

```
vannys-ecommerce/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        ← Schéma BDD + binaryTargets multi-env
│   │   └── seed.ts              ← Données initiales (admin + catégories)
│   ├── src/
│   │   ├── common/              ← Guards, filters, interceptors, decorators
│   │   ├── health/              ← /api/v1/health (Render health probe)
│   │   └── modules/
│   │       ├── auth/            ← JWT, register, login, refresh, reset
│   │       ├── users/           ← Profil, admin CRUD
│   │       ├── products/        ← CRUD, images Cloudinary, variantes
│   │       ├── categories/      ← CRUD catégories
│   │       ├── orders/          ← Création, historique, dashboard admin
│   │       ├── cloudinary/      ← Upload buffer, delete
│   │       └── mail/            ← Templates HTML via Resend API
│   ├── Dockerfile               ← Multi-stage, Debian bookworm, OpenSSL 3.x
│   ├── .env                     ← Variables locales (NE PAS commiter)
│   ├── .env.example             ← Template à commiter
│   ├── .nvmrc                   ← Node 20 (Render)
│   ├── tsconfig.json            ← rootDir=src, exclude prisma/
│   └── tsconfig.seed.json       ← Tsconfig séparé pour seed.ts
└── frontend/
    ├── src/
    │   ├── api/                 ← Services Axios typés (auth, products, orders, categories)
    │   ├── components/          ← UI, layout, produits, commandes
    │   ├── hooks/               ← React Query hooks
    │   ├── pages/               ← Pages publiques + admin
    │   ├── store/               ← Zustand stores (auth + cart)
    │   ├── types/               ← Types TypeScript globaux
    │   └── utils/               ← Helpers (formatPrice, dates, status labels)
    ├── vercel.json              ← SPA rewrites + cache headers + Node 20
    ├── .nvmrc                   ← Node 20 (Vercel)
    ├── .env                     ← Variables locales (NE PAS commiter)
    └── .env.example             ← Template à commiter
```

## Installation locale

### Prérequis
- Node.js 20.x (`nvm use 20`)
- PostgreSQL (local ou Supabase/Railway)
- Compte Resend (gratuit : 3 000 emails/mois)
- Compte Cloudinary (gratuit)

### Backend

```bash
cd backend

# 1. Installer les dépendances
npm ci

# 2. Copier et remplir les variables
cp .env.example .env
# → Remplir DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET,
#   CLOUDINARY_*, RESEND_API_KEY, MAIL_*

# 3. Créer la base de données et générer le client Prisma
npx prisma migrate dev --name init

# 4. Insérer les données de base (admin + catégories)
npm run prisma:seed

# 5. Démarrer en dev
npm run start:dev
```

### Frontend

```bash
cd frontend

# 1. Installer les dépendances
npm ci

# 2. Copier et remplir les variables
cp .env.example .env
# → Remplir VITE_API_URL=http://localhost:4000/api/v1

# 3. Démarrer en dev
npm run dev
```

## Déploiement

### Backend → Render

1. Créer un nouveau service **Web Service** sur Render
2. Choisir **Deploy from Dockerfile**
3. Pointer sur `./backend/Dockerfile`
4. Remplir toutes les variables d'environnement dans Render Dashboard
   (voir `backend/.env.example` pour la liste complète)
5. Render exécute automatiquement `prisma migrate deploy && node dist/main`

> **Important :** Le `Dockerfile` utilise `node:20-bookworm-slim` (Debian, OpenSSL 3.x).
> Les `binaryTargets` Prisma couvrent Debian, Alpine et ARM64.

### Frontend → Vercel

1. Importer le repo sur Vercel
2. **Root Directory** : `frontend`
3. **Build Command** : `npm run build`
4. Remplir `VITE_API_URL` dans les variables d'environnement Vercel
5. Vercel détecte automatiquement Vite

> Le `vercel.json` configure les rewrites SPA et le cache des assets.

## Variables d'environnement requises

### Backend (Render)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | URL PostgreSQL complète |
| `JWT_SECRET` | Secret JWT access (générer avec `openssl rand -base64 64`) |
| `JWT_REFRESH_SECRET` | Secret JWT refresh (différent du précédent) |
| `CLOUDINARY_CLOUD_NAME` | Nom du cloud Cloudinary |
| `CLOUDINARY_API_KEY` | Clé API Cloudinary |
| `CLOUDINARY_API_SECRET` | Secret API Cloudinary |
| `RESEND_API_KEY` | Clé API Resend (préfixe `re_`) |
| `MAIL_FROM_ADDRESS` | Adresse d'envoi vérifiée sur Resend |
| `MAIL_ADMIN_ADDRESS` | Email qui reçoit les notifications admin |
| `FRONTEND_URL` | URL du frontend Vercel (pour CORS + liens email) |

### Frontend (Vercel)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | URL complète du backend Render + `/api/v1` |

## Compte admin par défaut (seed)

| Champ | Valeur |
|-------|--------|
| Email | `admin@vannystouch.com` |
| Mot de passe | `Admin@123!` |

**Changer ce mot de passe en production.**

## API Routes

### Auth `/api/v1/auth`
| Méthode | Route | Auth |
|---------|-------|------|
| POST | `/register` | Public |
| POST | `/login` | Public |
| POST | `/logout` | Bearer |
| POST | `/refresh` | Public |
| POST | `/reset-password` | Public |
| GET | `/me` | Bearer |

### Produits `/api/v1/products`
| Méthode | Route | Auth |
|---------|-------|------|
| GET | `/` | Public |
| GET | `/:slug` | Public |
| POST | `/` | Admin |
| PATCH | `/:id` | Admin |
| DELETE | `/:id` | Admin |
| DELETE | `/images/:imageId` | Admin |
| PATCH | `/images/:imageId/primary` | Admin |

### Commandes `/api/v1/orders`
| Méthode | Route | Auth |
|---------|-------|------|
| GET | `/my` | Bearer |
| POST | `/` | Bearer |
| GET | `/:id` | Bearer (owner ou admin) |
| GET | `/admin/all` | Admin |
| GET | `/admin/stats` | Admin |
| PATCH | `/admin/:id/status` | Admin |

### Santé `/api/v1/health`
| Méthode | Route | Auth |
|---------|-------|------|
| GET | `/` | Public |

## Emails envoyés (via Resend)

| Événement | Destinataire |
|-----------|-------------|
| Inscription | Client (bienvenue) + Admin (notification) |
| Nouvelle commande | Client (confirmation) + Admin (détail complet) |
| Commande expédiée | Client |
| Mot de passe modifié | Client |
