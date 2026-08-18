# Prompt — Extension fonctionnelle et refonte visuelle de Vannys Touch

> **Usage** : copier l'intégralité de ce fichier comme instruction à un agent de développement
> travaillant dans le dépôt `H:\.Projets\Informatique\ProjetsCodes\Terminé-Déployé\SiteEcommerce\VannysTouch`.
> Le modèle fonctionnel de référence est le projet **SoleStride**
> (`H:\.Projets\Informatique\ProjetsCodes\Encours\Faisable\ventesChaussures`), à lire avant de coder,
> notamment `docs/API.md`, `docs/ARCHITECTURE.md` et `backend/sql/schema.sql`.

---

## 0. Mission

Étendre la boutique **Vannys Touch** (mode féminine : robes, tops, pantalons, ensembles,
accessoires) pour qu'elle atteigne le niveau fonctionnel de SoleStride, et **refondre son
interface**. L'application existante est en production : aucune régression n'est acceptable.

**Transposer, ne pas copier.** Les deux projets n'ont pas la même pile technique. On reprend les
*règles métier, les parcours et les garanties*, pas les fichiers : le code doit être écrit dans
les conventions de Vannys Touch (NestJS + Prisma, React + Zustand + React Query).

---

## 1. État des lieux

### 1.1 Pile cible (Vannys Touch — à respecter)

| Couche | Existant |
| --- | --- |
| Backend | NestJS 10, TypeScript 5.4, Prisma 5.16, **MySQL**, préfixe global `api/v1` |
| Auth | JWT access 15 min + refresh 7 j (haché en base), `JwtAuthGuard` + `AdminGuard` |
| Frontend | React 18, Vite 5, Tailwind 3, Zustand (persisté), React Query 5, Axios, lucide-react |
| Services | Cloudinary (images), Resend (emails) |
| Déploiement | Backend : Render (Docker, `render.yaml`, health `/api/v1/health`) · Frontend : Vercel |

> ⚠️ Le `README.md` annonce PostgreSQL alors que `prisma/schema.prisma` déclare `provider = "mysql"`.
> **Vérifier la base réellement utilisée en production avant toute migration**, puis corriger le README. NB: La base réellement utilisée est mysql via tidbcloud

### 1.2 Surface API déjà en place

`auth`: register · login · logout · refresh · reset-password · me —
`categories`: CRUD + `admin/all` —
`products`: liste · `:slug` · CRUD · suppression et image principale —
`orders`: `my` · création · `:id` · `admin/all` · `admin/stats` · `admin/:id/status` —
`users`: `me` · liste · `:id` · `:id/role` · `:id/toggle-active`.

### 1.3 Écarts à combler (cœur de la mission)

| Manque | Conséquence actuelle |
| --- | --- |
| Aucun **stock** sur `ProductVariant` (type/valeur seulement) | survente possible, aucune alerte |
| Panier **uniquement local** (Zustand persisté) | panier perdu d'un appareil à l'autre |
| Statut de commande sans **historique ni transitions contrôlées** | traçabilité nulle, états incohérents |
| Aucune **annulation client** | tout passe par l'administration |
| Aucune **vérification d'email**, réinitialisation par jeton à confirmer | comptes non fiables |
| Aucun **carnet d'adresses** | ressaisie complète à chaque commande |
| Aucune **notification** (in-app ni push) | le client doit relancer par téléphone |
| Frais de livraison figés en variables d'environnement | redéploiement nécessaire pour un tarif |
| Catalogue sans **filtres/tri/pagination** avancés | inexploitable au-delà de ~50 articles |
| Aucune **PWA**, aucun **mode sombre** | pas d'installation, confort limité |
| Modèle `Review` en base **sans module ni écran** | table morte |

---

## 2. Règles non négociables

1. **Aucune régression.** Les parcours actuels (inscription, connexion, catalogue, panier,
   commande, admin) doivent rester fonctionnels à chaque étape.
2. **Les paiements existants sont conservés.** Mobile money (`MTN`, `MOOV`, `ORANGE`, `CELTIIS`,
   table `payments`) reste en place ; on **ajoute** le *paiement à la livraison* comme mode
   supplémentaire. Le tunnel de commande doit être agnostique du mode de règlement.
3. **Le serveur est seul maître des montants.** Aucun `subtotal`, `shippingFee`, `total` ni
   `status` envoyé par le client n'est jamais retenu : tout est recalculé depuis la base.
4. **Toute écriture multi-tables passe par une transaction Prisma** (`$transaction`), avec
   verrouillage des stocks pendant la validation d'une commande.
5. **Schéma versionné** : chaque changement de modèle = une migration Prisma nommée
   (`npx prisma migrate dev --name …`), jamais un `db push`. Le `seed.ts` reste exécutable.
6. **Conventions de code existantes** : DTO `class-validator`, modules NestJS, `TransformInterceptor`,
   `HttpExceptionFilter`, code et identifiants en anglais, **interface et messages utilisateur en français**.
7. **TypeScript strict** : `tsc --noEmit` doit passer des deux côtés ; aucun `any` introduit.
8. **Aucun secret dans le dépôt.** Les `.env.example` ne contiennent que des espaces réservés ;
   les valeurs réelles vont dans `.env` (ignoré par git) et dans le tableau de bord de l'hébergeur.
9. **Rétrocompatibilité API** : ne pas renommer une route existante. Les nouveautés s'ajoutent ;
   une route remplacée reste en place le temps d'une version, avec mention `@deprecated`.

---

## 3. Lots fonctionnels

Chaque lot est livrable et testable indépendamment, dans cet ordre.

### L1 — Stocks et variantes réelles

- **Modèle** : `ProductVariant` devient une combinaison vendable —
  `size`, `color`, `stock` (`Int`, ≥ 0), `sku?`, `isActive`, unicité `(productId, size, color)`.
  Sur `Product` : `lowStockThreshold` (défaut 3), `reference` unique lisible.
  Migration de reprise : convertir les variantes `type/value` existantes sans perdre de données.
- **Règles** : la disponibilité d'un produit est dérivée de la somme des stocks
  (`available` / `low_stock` / `out_of_stock` / `disabled`). Le champ booléen `Product.inStock`
  devient une valeur **calculée** (ou est supprimé par migration) : deux sources de vérité pour
  la disponibilité finissent toujours par diverger. Une variante déjà commandée n'est jamais
  supprimée : elle est **désactivée** (l'historique doit rester exact).
- **API** : les variantes sont créées et modifiées avec le produit (`POST`/`PATCH /products`).
- **UI admin** : éditeur de variantes en tableau (taille × couleur × stock), badge « stock faible ».

### L2 — Panier serveur persistant

- **Modèle** : `Cart` (1 par utilisateur) + `CartItem` référençant une **variante**, jamais un prix.
- **API** (`/api/v1/cart`, authentifié) :

  | Route | Rôle |
  | --- | --- |
  | `GET /` | lignes + totaux **calculés par le serveur** |
  | `POST /` | ajoute `{ variantId, quantity }` (regroupe les doublons) |
  | `POST /merge` | fusionne le panier local d'un visiteur qui se connecte |
  | `PATCH /:itemId` | change la quantité (`0` supprime) |
  | `DELETE /:itemId` · `DELETE /` | retire une ligne · vide le panier |

- **Règles** : quantité plafonnée au stock disponible et à 20 par ligne ; chaque ligne renvoie
  `stock`, `available`, `alert` (ex. « il ne reste que 2 articles »). Les prix sont relus en base.
- **Front** : `cart.store.ts` conserve le panier hors connexion, puis appelle `POST /cart/merge`
  à la connexion et devient un simple miroir du panier serveur (invalidation React Query).

### L3 — Cycle de vie des commandes

- **Modèle** : `OrderStatusHistory` (`orderId`, `status`, `comment?`, `changedByUserId?`, `createdAt`).
  `Order` gagne `cancelledAt?`, `stockRestoredAt?`, et une `reference` au format `CMD-AAAAMMJJ-XXXXXX`.
- **Machine à états** — toute autre transition est refusée en `400` :

  ```
  pending    → confirmed | cancelled
  confirmed  → processing | cancelled
  processing → shipping | cancelled
  shipping   → delivered | delivery_failed | cancelled
  delivery_failed → shipping | cancelled
  delivered, cancelled : terminaux
  ```

  L'enum actuel vaut `pending | processing | delivered | cancelled`. **Ne pas renommer les valeurs
  existantes** : réutiliser `processing` comme état « en préparation » et n'ajouter que
  `confirmed`, `shipping` et `delivery_failed`, avec migration de reprise des commandes en cours.
- **Création de commande** (transaction unique) : verrouiller les variantes → vérifier
  produit/variante/stock → recalculer sous-total puis frais de livraison → enregistrer commande,
  lignes (**instantané** nom + image + prix unitaire) et état initial → décrémenter le stock →
  vider le panier → notifier client et administration.
  Erreurs : `403` email non vérifié · `400` panier vide · `409` stock insuffisant (préciser l'article).
- **Annulation par le client** : `POST /orders/:id/cancel`, autorisée aux seuls états `pending` et
  `confirmed`, remet le stock **une seule fois** (idempotence garantie par `stockRestoredAt`).
- **Admin** : `GET /orders/admin/:id` renvoie le détail, l'historique **et les transitions
  autorisées** depuis l'état courant, afin que l'interface ne propose jamais d'action invalide.

### L4 — Comptes : vérification d'email, mot de passe, adresses

- **Modèle** : `AccountToken` (`userId`, `type` = `email_verification` | `password_reset`,
  `tokenHash`, `expiresAt`, `usedAt?`) — le jeton n'est **jamais stocké en clair**.
  `Address` (`userId`, `label`, `fullName`, `phone`, `city`, `district`, `address`, `landmark?`, `isDefault`).
- **API** : `POST /auth/verify-email/request` · `POST /auth/verify-email/confirm` ·
  `POST /auth/password/forgot` · `POST /auth/password/reset` (jeton + expiration : 24 h pour la
  vérification, 2 h pour la réinitialisation) ; CRUD `/api/v1/addresses` avec adresse par défaut.
  Auditer l'actuel `POST /auth/reset-password` et le mettre en conformité (ou le déprécier).
- **Règles** : la réponse à « mot de passe oublié » est **toujours identique**, que l'email existe
  ou non (pas d'énumération de comptes). La commande exige un email vérifié.
- **UI** : pages de vérification et de réinitialisation, carnet d'adresses dans le profil,
  sélection d'une adresse enregistrée au moment de commander.

### L5 — Notifications

- **Modèle** : `Notification` (`userId`, `type`, `title`, `message`, `link`, `readAt?`) et
  `PushSubscription` (`userId`, `endpoint` unique, `p256dh`, `auth`, `userAgent?`).
- **API** : `GET /notifications` (+ compteur non lues) · `PATCH /notifications/:id/read` ·
  `PATCH /notifications/read-all` · `POST /notifications/push` · `DELETE /notifications/push`.
- **Déclencheurs** : commande créée (client + administrateurs), changement de statut, annulation,
  stock faible (administrateurs).
- **Push Web** : `web-push` avec clés VAPID, **facultatif** — si `VAPID_*` est absent, la
  fonctionnalité se désactive proprement, sans erreur ni écran cassé.
- **UI** : cloche avec pastille dans la barre de navigation + page « Notifications », chaque
  entrée pointant vers la ressource concernée.

### L6 — Réglages de boutique en base

- **Modèle** : table `Setting` clé/valeur typée, éditable par l'administration :
  frais de livraison, seuil de livraison gratuite, nom, téléphone, WhatsApp, email, adresse,
  message de livraison, modes de paiement activés.
- **API** : `GET /settings` (public, lecture seule) · `PUT /admin/settings`.
- **Migration** : `FREE_SHIPPING_THRESHOLD` et `SHIPPING_FEE` de `render.yaml` deviennent les
  **valeurs initiales** du seed ; le calcul des frais lit désormais la base, plus l'environnement.

### L7 — Catalogue avancé

- `GET /products` : `search`, `category`, `size`, `color`, `minPrice`, `maxPrice`, `availability`,
  `sort` (`recent|price_asc|price_desc|name|popular`), `featured`, `page`, `perPage` (≤ 60).
- `GET /products/filters` : valeurs réellement disponibles (catégories avec nombre de produits,
  tailles, couleurs, bornes de prix) pour construire l'interface sans valeurs mortes.
- Le catalogue public **n'expose jamais** un produit désactivé, quels que soient les paramètres reçus.
- **UI** : panneau de filtres (tiroir sur mobile), puces de filtres actifs avec retrait unitaire,
  tri, pagination, état vide explicite, squelettes de chargement.

### L8 — Administration

- **Tableau de bord** (`GET /admin/dashboard?days=30`) : chiffre d'affaires, nombre de commandes,
  panier moyen, nouveaux clients, ventes par jour (graphique), meilleurs produits, meilleurs
  clients, alertes de stock, dernières commandes.
- **Clients** : liste enrichie (tri par chiffre d'affaires, nombre de commandes, date, nom),
  fiche client (statistiques, commandes, adresses), suspension/réactivation.
- **Produits** : galerie multi-images (6 max) avec image principale et réordonnancement,
  suppression refusée en `409` si le produit a déjà été commandé, activation/désactivation.
- **Sécurité** : le rôle est **relu en base à chaque requête** (un jeton émis avant une
  rétrogradation ne donne aucun accès). Auditer `PATCH /users/:id/role` : le passage en `admin`
  doit être tracé, réservé à un administrateur, et impossible pour son propre compte.

### L9 — PWA et emails

- **PWA** : `manifest.webmanifest`, icônes générées, service worker, invitation d'installation
  discrète et **jamais imposée** (refus mémorisé). Stratégies : navigation → réseau d'abord avec
  page hors ligne ; fichiers de l'app → cache d'abord ; images → cache d'abord plafonné ;
  **API jamais mise en cache**.
- **Emails Resend** (gabarits HTML français, responsive, sans image distante bloquante) :
  vérification d'email, réinitialisation, confirmation de commande, changement de statut,
  nouvelle commande côté administration. En l'absence de clé API, mode simulation journalisé.

### L10 — Avis clients *(facultatif, si le temps le permet)*

Le modèle `Review` existe déjà sans aucun code : soit l'exploiter (avis limité aux clients ayant
**reçu** le produit, modération admin, recalcul de `rating`/`reviewsCount`), soit le supprimer par
migration. Ne pas laisser une table morte.

---

## 4. Refonte visuelle

**Direction** : élégance sobre et féminine, lisible sur mobile d'abord. L'or signature
(`#c8a96e`) est **conservé comme accent**, jamais comme fond de page ni comme couleur de texte
courant. Le résultat doit paraître dessiné par la même main sur toutes les pages, y compris l'admin.

1. **Jetons de conception** — remplacer les couleurs codées en dur par des variables CSS
   (`--background`, `--foreground`, `--primary`, `--muted`, `--border`, `--destructive`, `--radius`…)
   exposées à Tailwind via `theme.extend`. Une seule source de vérité pour les couleurs.
2. **Mode clair / sombre** — `darkMode: ['class']`, bascule dans l'en-tête, préférence mémorisée,
   respect de `prefers-color-scheme` au premier chargement. **Aucune** couleur ne doit être définie
   uniquement dans le bloc sombre.
3. **Bibliothèque de composants** — homogénéiser boutons, champs, cartes, badges, tableaux,
   boîtes de dialogue, tiroirs, info-bulles, squelettes. Composants réutilisables plutôt que des
   classes Tailwind recopiées de page en page.
4. **Accessibilité (exigence de recette)** : contraste AA minimum ; focus visible ; toute boîte de
   dialogue ou tiroir possède **un titre *et* une description** liés par `aria-labelledby` /
   `aria-describedby` ; chaque bouton icône a un `aria-label` ; navigation complète au clavier.
5. **États** — chargement (squelettes, pas de page blanche), vide (message + action), erreur
   (message français actionnable), succès (retour discret). Aucun écran ne doit rester muet.
6. **Pages à retravailler en priorité** : accueil (bannière, mise en avant, réassurance),
   catalogue (filtres + grille), fiche produit (galerie, sélection taille/couleur avec stock réel),
   panier et tunnel de commande (étapes claires, récapitulatif figé à droite),
   suivi de commande (frise des statuts), tableau de bord admin.
7. **Sobriété** — animations courtes (150–250 ms), respect de `prefers-reduced-motion`,
   pas d'effet gratuit. Polices : deux familles au maximum.

---

## 5. Qualité, tests et documentation

- **Tests** : règles de calcul (totaux, frais, remises), transitions de statut, décrément et
  restitution du stock, plafonds du panier, validation des DTO. Un test de non-régression par bogue
  corrigé.
- **Vérifications à faire passer** : `npm run lint`, `npm run type-check` / `tsc --noEmit`,
  `npm run build` des deux côtés, `prisma migrate deploy` sur base vierge, puis `prisma:seed`.
- **Documentation à mettre à jour dans le même lot que le code** : `README.md` (dont la
  contradiction PostgreSQL/MySQL), `.env.example` des deux applications, `render.yaml`, et une
  documentation d'API décrivant chaque nouvelle route (Swagger est déjà en place en développement).
- **Commits** : un lot = un commit cohérent, message en français à l'impératif, décrivant le
  *pourquoi*. Pas de commit fourre-tout.

---

## 6. Pièges déjà rencontrés en production (à éviter d'emblée)

| Symptôme | Cause réelle | Règle |
| --- | --- | --- |
| `blocked by CORS policy: No 'Access-Control-Allow-Origin'` | l'API **ne répondait pas du tout** (fonction non démarrée, 500 au boot) | Une réponse absente n'a pas d'en-tête. Diagnostiquer avec `curl` **avant** de toucher à la configuration CORS |
| Origine correcte mais refusée | barre oblique finale ou casse différente | Normaliser les origines ; accepter une liste + motifs (`https://*.vercel.app`) ; l'origine du front est ajoutée automatiquement |
| `429` incompréhensible côté navigateur | limitation de débit appliquée au *preflight* | Traiter `OPTIONS` avant toute limitation |
| `TypeError: Failed to convert value to 'Response'`, navigation cassée | un gestionnaire de service worker résolvait sur `undefined` | Toute branche `respondWith` retourne **toujours** une `Response` ; ne jamais mettre en cache une réponse redirigée ou opaque ; `Cache-Control: no-store` sur `sw.js` ; versionner le cache |
| `Missing Description or aria-describedby for DialogContent` | dialogue sans description | Voir §4.4 |
| Secrets réels dans un `.env.example` versionné | remplissage direct du modèle | Valeurs réelles **uniquement** dans `.env` ignoré par git |
| URL invalide (`http:s//…`) acceptée silencieusement | `new URL()` accepte cette forme | Valider les URL de configuration au démarrage et refuser de démarrer sinon |

---

## 7. Attendu final

Un dépôt Vannys Touch qui :

1. conserve tous ses parcours actuels et ses modes de paiement ;
2. gère stock réel, panier serveur, cycle de vie complet des commandes, comptes vérifiés,
   adresses, notifications, réglages en base, catalogue filtrable et administration complète ;
3. s'installe comme application (PWA) et propose un mode sombre ;
4. présente une interface homogène, accessible et responsive, fidèle à son identité dorée ;
5. démarre sur une base vierge avec `migrate deploy` + `seed`, sans aucun secret versionné.

**Avant de commencer** : lire le dépôt cible, lister les écarts constatés par rapport au §1.3,
signaler toute divergence avec ce document, puis proposer un plan de livraison lot par lot.
Ne pas coder avant validation de ce plan.
