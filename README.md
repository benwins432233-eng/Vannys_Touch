Using Node.js 20, Tailwind CSS v3.4.19, and Vite v7.2.4

Tailwind CSS has been set up with the shadcn theme

Setup complete: /mnt/okcomputer/output/app

Components (40+):
  accordion, alert-dialog, alert, aspect-ratio, avatar, badge, breadcrumb,
  button-group, button, calendar, card, carousel, chart, checkbox, collapsible,
  command, context-menu, dialog, drawer, dropdown-menu, empty, field, form,
  hover-card, input-group, input-otp, input, item, kbd, label, menubar,
  navigation-menu, pagination, popover, progress, radio-group, resizable,
  scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner,
  spinner, switch, table, tabs, textarea, toggle-group, toggle, tooltip

Usage:
  import { Button } from '@/components/ui/button'
  import { Card, CardHeader, CardTitle } from '@/components/ui/card'

Structure:
  src/sections/        Page sections
  src/hooks/           Custom hooks
  src/types/           Type definitions
  src/App.css          Styles specific to the Webapp
  src/App.tsx          Root React component
  src/index.css        Global styles
  src/main.tsx         Entry point for rendering the Webapp
  index.html           Entry point for the Webapp
  tailwind.config.js   Configures Tailwind's theme, plugins, etc.
  vite.config.ts       Main build and dev server settings for Vite
  postcss.config.js    Config file for CSS post-processing tools


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


# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

<p align="center"><a href="https://laravel.com" target="_blank"><img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="400" alt="Laravel Logo"></a></p>

<p align="center">
<a href="https://github.com/laravel/framework/actions"><img src="https://github.com/laravel/framework/workflows/tests/badge.svg" alt="Build Status"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/dt/laravel/framework" alt="Total Downloads"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/v/laravel/framework" alt="Latest Stable Version"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/l/laravel/framework" alt="License"></a>
</p>

## About Laravel

Laravel is a web application framework with expressive, elegant syntax. We believe development must be an enjoyable and creative experience to be truly fulfilling. Laravel takes the pain out of development by easing common tasks used in many web projects, such as:

- [Simple, fast routing engine](https://laravel.com/docs/routing).
- [Powerful dependency injection container](https://laravel.com/docs/container).
- Multiple back-ends for [session](https://laravel.com/docs/session) and [cache](https://laravel.com/docs/cache) storage.
- Expressive, intuitive [database ORM](https://laravel.com/docs/eloquent).
- Database agnostic [schema migrations](https://laravel.com/docs/migrations).
- [Robust background job processing](https://laravel.com/docs/queues).
- [Real-time event broadcasting](https://laravel.com/docs/broadcasting).

Laravel is accessible, powerful, and provides tools required for large, robust applications.

## Learning Laravel

Laravel has the most extensive and thorough [documentation](https://laravel.com/docs) and video tutorial library of all modern web application frameworks, making it a breeze to get started with the framework. You can also check out [Laravel Learn](https://laravel.com/learn), where you will be guided through building a modern Laravel application.

If you don't feel like reading, [Laracasts](https://laracasts.com) can help. Laracasts contains thousands of video tutorials on a range of topics including Laravel, modern PHP, unit testing, and JavaScript. Boost your skills by digging into our comprehensive video library.

## Laravel Sponsors

We would like to extend our thanks to the following sponsors for funding Laravel development. If you are interested in becoming a sponsor, please visit the [Laravel Partners program](https://partners.laravel.com).

### Premium Partners

- **[Vehikl](https://vehikl.com)**
- **[Tighten Co.](https://tighten.co)**
- **[Kirschbaum Development Group](https://kirschbaumdevelopment.com)**
- **[64 Robots](https://64robots.com)**
- **[Curotec](https://www.curotec.com/services/technologies/laravel)**
- **[DevSquad](https://devsquad.com/hire-laravel-developers)**
- **[Redberry](https://redberry.international/laravel-development)**
- **[Active Logic](https://activelogic.com)**

## Contributing

Thank you for considering contributing to the Laravel framework! The contribution guide can be found in the [Laravel documentation](https://laravel.com/docs/contributions).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).















  
