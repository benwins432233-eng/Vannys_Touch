# Vannys Touch — E-Commerce TypeScript

Application e-commerce full-stack refaite entièrement en TypeScript.

## Stack

| Couche | Technologie |
|--------|-------------|
| Backend | NestJS · TypeScript · Prisma · PostgreSQL |
| Frontend | React 18 · TypeScript · Vite · Tailwind CSS |
| Auth | JWT (access + refresh token) |
| Fichiers | Cloudinary SDK |
| Emails | Nodemailer (SMTP) |
| State | Zustand + React Query |

## Structure

```
vannys-ecommerce/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       ← Schéma BDD complet
│   │   └── seed.ts             ← Données initiales
│   ├── src/
│   │   ├── common/             ← Guards, filters, interceptors, decorators
│   │   ├── modules/
│   │   │   ├── auth/           ← JWT, register, login, refresh, reset
│   │   │   ├── users/          ← Profil, admin CRUD
│   │   │   ├── products/       ← CRUD, images Cloudinary, variantes
│   │   │   ├── categories/     ← CRUD catégories
│   │   │   ├── orders/         ← Création, historique, dashboard admin
│   │   │   ├── cloudinary/     ← Upload buffer, delete
│   │   │   └── mail/           ← Templates HTML, envoi SMTP
│   │   ├── prisma/             ← PrismaService global
│   │   ├── app.module.ts
│   │   └── main.ts
│   └── .env                    ← Variables d'environnement
└── frontend/
    ├── src/
    │   ├── api/                ← Services Axios typés
    │   ├── components/         ← UI, layout, produits, commandes
    │   ├── hooks/              ← React Query hooks
    │   ├── pages/              ← Pages publiques + admin
    │   ├── store/              ← Zustand (auth + cart)
    │   ├── types/              ← Types TypeScript globaux
    │   └── utils/              ← Helpers (formatPrice, dates, etc.)
    └── .env                    ← Variables Vite
```

## API Routes

### Auth  `/api/v1/auth`
| Méthode | Route | Accès |
|---------|-------|-------|
| POST | `/register` | Public |
| POST | `/login` | Public |
| POST | `/logout` | Auth |
| POST | `/refresh` | Public |
| POST | `/reset-password` | Public |
| GET | `/me` | Auth |

### Produits  `/api/v1/products`
| Méthode | Route | Accès |
|---------|-------|-------|
| GET | `/` | Public |
| GET | `/:slug` | Public |
| POST | `/` | Admin |
| PATCH | `/:id` | Admin |
| DELETE | `/:id` | Admin |
| DELETE | `/images/:imageId` | Admin |
| PATCH | `/images/:imageId/primary` | Admin |

### Commandes  `/api/v1/orders`
| Méthode | Route | Accès |
|---------|-------|-------|
| GET | `/my` | Auth |
| POST | `/` | Auth |
| GET | `/:id` | Auth (owner/admin) |
| GET | `/admin/all` | Admin |
| GET | `/admin/stats` | Admin |
| PATCH | `/admin/:id/status` | Admin |

## Installation

### Backend
```bash
cd backend
npm install
cp .env.example .env   # remplir les variables
npx prisma migrate dev --name init
npx prisma db seed
npm run start:dev
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env   # remplir VITE_API_URL
npm run dev
```

## Variables d'environnement

Voir `backend/.env` et `frontend/.env` — tous les champs sont documentés dans ces fichiers.

## Comptes par défaut (après seed)

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | admin@vannystouch.com | Admin@123! |

## Architecture des emails

Les commandes sont envoyées directement par email à l'administrateur (`MAIL_ADMIN_ADDRESS`).
Aucune intégration de paiement n'est présente — le règlement s'effectue à la livraison.

Emails envoyés :
- Bienvenue au nouvel utilisateur
- Notification admin à chaque inscription
- Confirmation de commande au client
- Notification admin à chaque nouvelle commande (avec détail complet)
- Notification d'expédition au client
