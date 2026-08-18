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

## Panier serveur

Depuis le lot L2, le panier d'un client connecté vit en base (`carts`,
`cart_items`) : il le retrouve d'un appareil à l'autre, et un vidage de cache ne
l'efface plus. Une ligne désigne une **variante** et une quantité, **jamais un
prix** — le montant est relu en base à chaque affichage, pour qu'un panier
ancien ne fige pas un tarif périmé.

| Route | Rôle |
| --- | --- |
| `GET /api/v1/cart` | Lignes et totaux, calculés par le serveur |
| `POST /api/v1/cart` | Ajoute `{ variantId, quantity }` ; un doublon incrémente la ligne |
| `POST /api/v1/cart/merge` | Fusionne le panier local d'un visiteur qui se connecte |
| `PATCH /api/v1/cart/:itemId` | Change la quantité — `0` supprime la ligne |
| `DELETE /api/v1/cart/:itemId` | Retire une ligne |
| `DELETE /api/v1/cart` | Vide le panier |

Toutes ces routes exigent un jeton. Règles appliquées côté serveur :

- quantité plafonnée au stock disponible **et** à 20 par ligne ;
- chaque ligne renvoie `stock`, `available` et, le cas échéant, `alert`
  (« Il ne reste que 2 article(s)… ») ; `hasIssues` signale au tunnel de
  commande qu'un article bloque ;
- un stock qui baisse après l'ajout n'est jamais corrigé en douce pendant une
  lecture : la ligne est signalée, et seule la quantité réellement servable
  compte dans les totaux ;
- la fusion **ajoute** au panier existant plutôt que de le remplacer, et ignore
  les articles introuvables au lieu d'échouer. Les paniers enregistrés avant le
  lot L1 (sans `variantId`) sont résolus depuis produit + couleur + taille.

Hors connexion, le panier reste dans le navigateur (`cart.store.ts`). Le hook
`useCart()` expose une vue unique des deux mondes : les pages n'ont pas à savoir
où vit le panier.

## Cycle de vie d'une commande

Depuis le lot L3, le statut d'une commande n'est plus une valeur écrasée sur
place : chaque changement est tracé dans `order_status_history` (état, date,
auteur, commentaire), et seules les transitions ci-dessous sont acceptées.
Toute autre est refusée en **400**.

```
pending    → confirmed | cancelled
confirmed  → processing | cancelled
processing → shipping | cancelled
shipping   → delivered | delivery_failed | cancelled
delivery_failed → shipping | cancelled
delivered, cancelled : terminaux
```

`processing` signifie « en préparation ». La valeur existait déjà et n'a pas été
renommée : MySQL stocke l'**indice** d'une valeur d'ENUM, pas son texte, donc
renommer ou réordonner réinterpréterait les commandes existantes. Les trois
nouveaux états sont ajoutés en fin de liste.

**Création** (`POST /api/v1/orders`) — une seule transaction : verrouillage des
variantes (`SELECT … FOR UPDATE`), vérification du stock, recalcul des montants
depuis la base, écriture de la commande, des lignes (instantané nom + image +
prix unitaire) et de l'état initial, décrément du stock, puis vidage du panier.
Le contenu vient du **panier serveur** ; le champ `items` de la requête est
`@deprecated` et n'est lu que si le panier est vide. Erreurs : `400` panier vide
ou déclinaison retirée, `409` stock insuffisant (l'article est nommé).

**Annulation par la cliente** (`POST /api/v1/orders/:id/cancel`) — permise
seulement en `pending` et `confirmed`. Le stock n'est restitué qu'une fois :
`stock_restored_at` sert de verrou d'idempotence.

**Administration** — `GET /api/v1/orders/admin/:id` renvoie le détail,
l'historique **et les transitions autorisées** depuis l'état courant, pour que
l'interface ne propose jamais une action que l'API refusera.

**Références** — les nouvelles commandes prennent le format
`CMD-AAAAMMJJ-XXXXXX`, suffixe tiré au sort. L'ancien `count() + 1` donnait la
même référence à deux commandes simultanées. Les références déjà émises
(`VT-00001`) ne sont pas réécrites : elles figurent dans les emails envoyés.

**Paiement** — le paiement à la livraison (`CASH_ON_DELIVERY`) devient le mode
par défaut, les modes mobile money restent acceptés. Jusqu'ici toute commande
était enregistrée en `MTN` faute d'alternative, alors que le règlement se faisait
déjà à la livraison.

## Comptes, mots de passe et adresses

### Vérification d'email

Le lien de vérification part dès l'inscription et **la commande l'exige** : sans
adresse valide, la cliente ne recevrait aucun email de suivi et personne ne s'en
apercevrait. Le rappel est affiché dans le profil et dans le tunnel de commande,
jamais découvert au dernier moment.

| Route | Rôle |
| --- | --- |
| `POST /api/v1/auth/verify-email/request` | Renvoyer le lien (compte connecté) |
| `POST /api/v1/auth/verify-email/confirm` | Confirmer avec le jeton reçu |
| `POST /api/v1/auth/password/forgot` | Demander un lien de réinitialisation |
| `POST /api/v1/auth/password/reset` | Choisir un nouveau mot de passe (jeton) |
| `POST /api/v1/auth/password/change` | Changer son mot de passe (mot de passe actuel exigé) |
| `POST /api/v1/auth/reset-password` | **@deprecated** — alias de `password/change` |

> **Comptes existants** : la migration `5_accounts_addresses` les marque comme
> vérifiés à leur date d'inscription. Ils n'ont jamais eu l'occasion de
> confirmer ; les laisser non vérifiés bloquerait toutes les clientes actuelles.
> Cela ne prouve pas la validité de leurs adresses — l'administration peut
> retirer la vérification au cas par cas.

### Jetons

Seule l'**empreinte SHA-256** du jeton est stockée (`account_tokens`) : une fuite
de la base ne donne accès à aucun compte. Validité : **24 h** pour une
vérification d'email, **2 h** pour une réinitialisation. Un jeton ne sert qu'une
fois, et émettre un nouveau lien invalide le précédent.

Deux garde-fous :

- « mot de passe oublié » renvoie **toujours la même réponse**, que l'adresse
  existe ou non — sinon on pourrait dresser la liste des comptes de la boutique ;
- une nouvelle demande du même type est ignorée pendant **2 minutes**, sans quoi
  une seule adresse suffirait à noyer une boîte mail.

### Carnet d'adresses

CRUD sur `/api/v1/addresses` (10 adresses maximum par compte), avec
`PATCH /:id/default` pour changer l'adresse par défaut. Le carnet ne reste jamais
sans adresse par défaut : la première créée l'est d'office, et la suppression de
l'adresse par défaut promeut la plus ancienne restante.

Le tunnel de commande pré-remplit le formulaire avec l'adresse par défaut. La
commande garde une **copie** de l'adresse, jamais une référence : modifier son
carnet ne doit pas réécrire l'endroit où une commande passée a été livrée.

## Notifications

Une cliente n'était prévenue de rien : tout passait par un email — quand
l'adresse était bonne — ou par un appel. Les notifications sont désormais
enregistrées en base et consultables dans l'application, cloche dans l'en-tête
et page « Notifications ».

| Route | Rôle |
| --- | --- |
| `GET /api/v1/notifications` | Fil paginé et compteur de non-lues |
| `PATCH /api/v1/notifications/:id/read` | Marquer une notification comme lue |
| `PATCH /api/v1/notifications/read-all` | Tout marquer comme lu |
| `POST /api/v1/notifications/push` | Abonner un appareil |
| `DELETE /api/v1/notifications/push` | Désabonner un appareil |
| `GET /api/v1/notifications/push/config` | Clé publique VAPID (public) |

**Déclencheurs** : commande enregistrée (cliente **et** administration),
changement de statut, annulation, et stock faible après une commande — le seuil
s'apprécie sur le **produit entier**, pas sur une seule déclinaison : trois
tailles à une unité chacune, ce n'est pas une rupture.

Une notification n'échoue jamais bruyamment : elle est rendue en plus du
parcours, et une panne d'envoi ne doit pas faire échouer la commande qui l'a
déclenchée.

### Push web — facultatif

Renseigner `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` et `VAPID_SUBJECT` (générables
avec `npx web-push generate-vapid-keys`). **Sans ces clés, le push se désactive
proprement** : le serveur démarre, l'interface n'affiche pas l'option, et les
notifications restent consultables dans l'application. Faire échouer le
démarrage pour une fonctionnalité de confort priverait la boutique de tout le
reste.

Un abonnement refusé par le navigateur (404/410) est supprimé automatiquement :
le garder ferait échouer tous les envois suivants.

Le service worker (`public/sw.js`) ne gère pour l'instant que le push. Le cache
et le mode hors ligne arriveront **dans ce même fichier** au lot L9 : un site
n'a qu'un service worker par portée, en enregistrer un second remplacerait
celui-ci. Il est servi avec `Cache-Control: no-store` — un worker périmé
survivrait sinon à tous les déploiements suivants.

## Réglages de boutique

Les frais de livraison et le seuil de gratuité vivaient dans les variables
d'environnement de Render : changer un tarif demandait un redéploiement. Le
frontend en gardait sa propre copie en dur, si bien que les deux pouvaient
afficher des montants différents. Le nom, le téléphone, le WhatsApp, l'email et
l'adresse étaient, eux, écrits en dur dans le pied de page.

Tout cela vit désormais dans la table `settings`, éditable depuis
**Administration → Réglages**, et s'applique **sans redéploiement**.

| Route | Rôle |
| --- | --- |
| `GET /api/v1/settings` | Réglages publics (lecture seule, sans jeton) |
| `GET /api/v1/admin/settings` | Valeurs **et** catalogue des champs éditables |
| `PUT /api/v1/admin/settings` | Modification partielle |

Réglages disponibles : `shipping.fee`, `shipping.freeThreshold`,
`shipping.message`, `shop.name`, `shop.phone`, `shop.whatsapp`, `shop.email`,
`shop.address`, `payment.methods`.

Le catalogue (`settings-catalog.ts`) est la source unique : clé, type, valeur par
défaut et validation. Sans lui, `PUT /admin/settings` accepterait n'importe
quelle clé et la boutique se retrouverait avec des réglages fantômes que
personne ne lit. Une clé inconnue ou une valeur refusée annule **toute** la mise
à jour — une modification à moitié appliquée laisserait un état incohérent.

Quelques règles portées par la validation : les frais ne peuvent pas être
négatifs, le WhatsApp n'accepte que des chiffres (`wa.me` casse sur un « + »), et
au moins un mode de paiement doit rester activé, sans quoi plus personne ne peut
commander.

Les valeurs sont mises en cache 60 secondes côté serveur — elles sont relues à
chaque calcul de panier. Le cache est vidé à l'écriture ; sur plusieurs
instances, une modification met au plus une minute à se propager partout.

> `FREE_SHIPPING_THRESHOLD` et `SHIPPING_FEE` ne sont plus lus. Ils restent dans
> `render.yaml` le temps d'une version : la migration `7_shop_settings` a repris
> leurs valeurs telles quelles, donc rien n'a changé pour les clientes le jour
> du déploiement.

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
