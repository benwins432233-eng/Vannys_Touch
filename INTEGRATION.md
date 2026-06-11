# 🔌 Guide d'intégration API — Vanny's Touch

## Architecture

```
React (Vite) ←→ Laravel API (Sanctum) ←→ MySQL
                       ↕
                 Cloudinary (images)
```

---

## 📁 Fichiers fournis

```
src/
├── api/
│   ├── client.ts          # Client HTTP de base (token, erreurs, events)
│   └── services.ts        # Services : auth, products, categories, orders
│
├── types/
│   └── index.ts           # Types TypeScript alignés sur les réponses Laravel
│
├── hooks/
│   ├── useAuth.tsx         # Auth branchée sur l'API (remplace le mock)
│   ├── useCart.tsx         # Panier (types mis à jour)
│   └── useApi.ts           # useProducts, useProduct, useCategories, useOrders
│
├── pages/
│   ├── Shop.tsx            # Boutique avec filtres → API
│   ├── ProductDetail.tsx   # Détail produit → API (route par slug)
│   └── Login.tsx           # Auth réelle avec validation Laravel
│
└── App.tsx                 # Routes mises à jour + loading auth
```

---

## 🚀 Installation

### 1. Variables d'environnement

Copier `.env.example` en `.env.local` :

```env
VITE_API_URL=http://localhost:8000/api
```

### 2. Remplacer les fichiers

Copier chaque fichier fourni dans le dossier `src/` de ton projet Vite.

### 3. Supprimer les imports mock

Dans les fichiers qui importaient depuis `@/data/products`, supprimer ces lignes :
```ts
// AVANT (mock) — supprimer
import { products, categories } from '@/data/products';

// APRÈS (API) — déjà dans les nouveaux fichiers
import { useProducts } from '@/hooks/useApi';
```

---

## 🔧 Configuration Laravel

### CORS (`config/cors.php`)

```php
return [
    'paths'             => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_origins'   => [env('FRONTEND_URL', 'http://localhost:5173')],
    'allowed_methods'   => ['*'],
    'allowed_headers'   => ['*'],
    'exposed_headers'   => [],
    'max_age'           => 0,
    'supports_credentials' => false,
];
```

### Route produit par slug

Le frontend utilise maintenant `/product/:slug` au lieu de `/product/:id`.

Vérifier que la route Laravel retourne bien le slug dans ses réponses (déjà inclus dans les models).

### Sanctum (`config/sanctum.php`)

```php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', 'localhost,127.0.0.1')),
```

---

## 📡 Endpoints consommés

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| POST | `/auth/login` | Non | Connexion |
| POST | `/auth/register` | Non | Inscription |
| POST | `/auth/logout` | Oui | Déconnexion |
| GET | `/auth/me` | Oui | Profil courant |
| GET | `/products` | Non | Liste produits (filtres, pagination) |
| GET | `/products/:slug` | Non | Détail produit |
| GET | `/categories` | Non | Liste catégories |
| GET | `/orders` | Oui | Mes commandes |
| POST | `/orders` | Oui | Passer une commande |
| POST | `/admin/products` | Admin | Créer produit |
| POST | `/admin/products/:id` | Admin | Modifier produit (_method=PUT) |
| DELETE | `/admin/products/:id` | Admin | Supprimer produit |
| GET | `/admin/orders` | Admin | Toutes les commandes |
| PATCH | `/admin/orders/:id/status` | Admin | Changer statut commande |

---

## ⚙️ Gestion des erreurs

Le client HTTP (`api/client.ts`) gère automatiquement :

- **401** → suppression du token + event `auth:expired` → déconnexion auto
- **422** → erreurs de validation Laravel exposées dans `ApiException.errors`
- **500** → message générique

---

## 🔄 Flow d'authentification

```
1. App démarre
2. useAuth vérifie si token existe dans localStorage
3. Si oui → appel GET /auth/me pour valider le token
4. Si invalide → token supprimé, user = null
5. Login → POST /auth/login → token stocké → user mis à jour
6. Toutes les requêtes suivantes incluent automatiquement le Bearer token
```

---

## 📦 Données du panier → Commande

Lors du paiement, convertir le panier en payload API :

```ts
import { useCart } from '@/hooks/useCart';
import { ordersService } from '@/api/services';

const { items, clearCart } = useCart();

const payload = {
  payment_method: 'MTN',
  phone_number: '+237 670000000',
  items: items.map(item => ({
    product_id: item.product.id,
    quantity: item.quantity,
    color: item.selected_color,
    size: item.selected_size,
  })),
};

const order = await ordersService.create(payload);
clearCart();
```
