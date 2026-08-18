# Vannys Touch — E-Commerce TypeScript

Application e-commerce full-stack TypeScript. Backend NestJS sur Render, frontend React sur Vercel.

## Stack

| Couche | Technologie |
|--------|-------------|
| Backend | NestJS 10 · TypeScript 5.4 · Prisma 5.16 · MySQL (TiDB Cloud) |
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
- MySQL 8 (la production tourne sur TiDB Cloud, compatible MySQL)
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

# 3. Appliquer les migrations et générer le client Prisma
npx prisma migrate deploy
npx prisma generate

# 4. Insérer les données de base (admin + catégories)
npm run prisma:seed

# 5. Démarrer en dev
npm run start:dev

# Tests des règles métier (totaux, frais, disponibilité)
npm test
```

> **Migrations** : ne jamais utiliser `prisma db push` — le schéma est versionné
> par les fichiers de `prisma/migrations`. Sur une base déjà en service,
> sauvegarder avant `migrate deploy`.

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

## Stock et déclinaisons

Depuis le lot L1, **une ligne de `product_variants` est une combinaison vendable**
(taille × couleur) et c'est elle qui porte le stock. Un produit qui ne se décline
pas garde une combinaison unique, taille et couleur nulles.

- La disponibilité n'est **pas** stockée : l'API la calcule à partir de la somme
  des stocks des variantes actives et l'expose dans chaque produit —
  `availability` vaut `available`, `low_stock`, `out_of_stock` ou `disabled`,
  `totalStock` donne le reste, `lowStockThreshold` le seuil d'alerte (3 par défaut).
- `inStock` reste renvoyé pour les clients déjà déployés, mais c'est désormais
  une valeur dérivée : la colonne `products.in_stock` a été supprimée.
- Une variante déjà commandée n'est jamais supprimée par l'éditeur admin : elle
  est désactivée, pour que l'historique des commandes reste exact.
- `POST` et `PATCH /products` acceptent `variants`, un tableau JSON
  `[{ size, color, stock, sku, isActive }]`. Les anciens champs `colors` et
  `sizes` restent acceptés (`@deprecated`) et sont combinés en produit cartésien.

> **Après la migration `2_variant_stock`** : les stocks repris valent 10 unités
> pour les produits qui étaient marqués en stock, 0 pour les autres. L'ancien
> modèle ne stockait aucune quantité — un inventaire réel doit être saisi dans
> l'administration. Les anciennes lignes sont conservées dans la table
> `product_variants_legacy`, supprimable une fois l'inventaire vérifié.

## Variables d'environnement requises

### Backend (Render)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | URL MySQL complète (`mysql://user:motdepasse@hôte:4000/base`) |
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
