-- L3 — Cycle de vie des commandes
--
-- Le statut d'une commande était une valeur écrasée sur place : impossible de
-- dire quand elle est passée en préparation, ni qui l'a annulée. Aucune
-- transition n'était contrôlée non plus — l'administration pouvait faire passer
-- une commande livrée en attente.
--
-- Cette migration ajoute les états manquants, la trace de chaque changement, et
-- les horodatages qui rendent l'annulation idempotente.

-- ── 1. Nouveaux états ────────────────────────────────────────────────────────
--
-- ATTENTION : MySQL stocke l'INDICE d'une valeur d'ENUM, pas son texte.
-- 'pending' vaut 1, 'processing' 2, 'delivered' 3, 'cancelled' 4. Réordonner
-- cette liste réinterpréterait toutes les commandes existantes — une commande
-- livrée deviendrait « annulée ». Les nouvelles valeurs sont donc ajoutées À LA
-- FIN, et les anciennes ne sont ni renommées ni déplacées.
--
-- `processing` garde son sens : « en préparation ».

ALTER TABLE `orders`
  MODIFY COLUMN `status`
    ENUM('pending','processing','delivered','cancelled','confirmed','shipping','delivery_failed')
    NOT NULL DEFAULT 'pending';

-- Paiement à la livraison : mode supplémentaire, sans retirer le mobile money.
-- Même règle que ci-dessus — la valeur est ajoutée à la fin, jamais intercalée.
--
-- Les commandes existantes sont toutes enregistrées en 'MTN' alors que le
-- règlement se faisait déjà à la livraison : l'ancien code forçait cette valeur
-- faute d'alternative. Elles ne sont PAS réécrites — on ne réinvente pas des
-- données de paiement après coup.

ALTER TABLE `orders`
  MODIFY COLUMN `payment_method`
    ENUM('MTN','MOOV','ORANGE','CELTIIS','CASH_ON_DELIVERY') NOT NULL;

-- ── 2. Annulation et restitution du stock ────────────────────────────────────

ALTER TABLE `orders` ADD COLUMN `cancelled_at` TIMESTAMP NULL;
-- Verrou d'idempotence : une commande annulée ne rend son stock qu'une fois.
ALTER TABLE `orders` ADD COLUMN `stock_restored_at` TIMESTAMP NULL;

-- Les commandes déjà annulées n'ont jamais décrémenté de stock (le stock
-- n'existait pas avant le lot L1) : on les marque comme déjà restituées, sinon
-- une annulation rejouée créditerait des articles jamais retirés.
UPDATE `orders`
   SET `cancelled_at` = COALESCE(`updated_at`, `created_at`),
       `stock_restored_at` = COALESCE(`updated_at`, `created_at`)
 WHERE `status` = 'cancelled';

-- ── 3. Lien entre ligne de commande et variante ──────────────────────────────
--
-- L'instantané (nom, prix, taille, couleur) reste la vérité de l'historique.
-- `variant_id` s'y ajoute pour savoir quel stock recréditer à l'annulation sans
-- avoir à deviner la déclinaison à partir de deux chaînes de caractères.

ALTER TABLE `order_items` ADD COLUMN `variant_id` BIGINT UNSIGNED NULL;
CREATE INDEX `order_items_variant_id_index` ON `order_items`(`variant_id`);
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_variant_id_foreign` FOREIGN KEY (`variant_id`)
    REFERENCES `product_variants` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- Reprise : rattacher les lignes existantes à la variante correspondante quand
-- elle est identifiable sans ambiguïté. Les autres restent nulles, l'instantané
-- suffit à les afficher.
UPDATE `order_items` oi
  JOIN `product_variants` pv
    ON pv.`product_id` = oi.`product_id`
   AND (pv.`color` <=> oi.`variant_color`)
   AND (pv.`size` <=> oi.`variant_size`)
   SET oi.`variant_id` = pv.`id`
 WHERE oi.`variant_id` IS NULL;

-- ── 4. Historique des statuts ────────────────────────────────────────────────

CREATE TABLE `order_status_history` (
  `id`                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id`            BIGINT UNSIGNED NOT NULL,
  `status`              ENUM('pending','processing','delivered','cancelled','confirmed','shipping','delivery_failed') NOT NULL,
  `comment`             TEXT NULL,
  `changed_by_user_id`  BIGINT UNSIGNED NULL,
  `created_at`          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `order_status_history_order_id_index` (`order_id`),
  CONSTRAINT `order_status_history_order_id_foreign` FOREIGN KEY (`order_id`)
    REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  -- Un compte supprimé ne doit pas effacer l'historique : on perd l'auteur,
  -- pas l'événement.
  CONSTRAINT `order_status_history_changed_by_foreign` FOREIGN KEY (`changed_by_user_id`)
    REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION
);

-- Reprise des commandes en cours : une entrée « créée » à la date de création,
-- puis l'état courant s'il a changé depuis. On ne peut pas reconstituer les
-- étapes intermédiaires — elles n'ont jamais été enregistrées — mais une frise
-- vide serait pire qu'une frise partielle.
INSERT INTO `order_status_history` (`order_id`, `status`, `comment`, `created_at`)
SELECT o.`id`, 'pending', 'Reprise : commande enregistrée', COALESCE(o.`created_at`, NOW())
  FROM `orders` o;

INSERT INTO `order_status_history` (`order_id`, `status`, `comment`, `created_at`)
SELECT o.`id`, o.`status`, 'Reprise : état au moment de la migration',
       COALESCE(o.`updated_at`, o.`created_at`, NOW())
  FROM `orders` o
 WHERE o.`status` <> 'pending';

-- ── 5. Références de commande ────────────────────────────────────────────────
--
-- Les nouvelles commandes prennent le format CMD-AAAAMMJJ-XXXXXX, généré côté
-- application. Les références existantes (VT-00001) ne sont PAS réécrites :
-- elles figurent dans les emails déjà envoyés et dans les échanges avec les
-- clientes. Une référence qui change n'est plus une référence.
