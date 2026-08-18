-- L2 — Panier serveur persistant
--
-- Le panier ne vivait que dans le navigateur (Zustand persisté). Une cliente qui
-- remplissait son panier sur téléphone le retrouvait vide sur ordinateur, et un
-- vidage de cache l'effaçait sans recours.
--
-- Une ligne désigne une VARIANTE et une quantité — jamais un prix. Le montant
-- est relu en base à chaque affichage : un panier vieux de trois semaines ne doit
-- pas figer un tarif qui n'a plus cours.

CREATE TABLE `carts` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    BIGINT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `carts_user_id_unique` (`user_id`),
  CONSTRAINT `carts_user_id_foreign` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE TABLE `cart_items` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `cart_id`    BIGINT UNSIGNED NOT NULL,
  `variant_id` BIGINT UNSIGNED NOT NULL,
  `quantity`   INT UNSIGNED NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  -- Une seule ligne par variante : un deuxième ajout incrémente la quantité.
  UNIQUE INDEX `cart_items_cart_id_variant_id_unique` (`cart_id`, `variant_id`),
  INDEX `cart_items_cart_id_index` (`cart_id`),
  INDEX `cart_items_variant_id_index` (`variant_id`),
  CONSTRAINT `cart_items_cart_id_foreign` FOREIGN KEY (`cart_id`)
    REFERENCES `carts` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  -- Une variante supprimée emporte les lignes qui la désignaient : mieux vaut
  -- une ligne disparue qu'un panier qui pointe dans le vide.
  CONSTRAINT `cart_items_variant_id_foreign` FOREIGN KEY (`variant_id`)
    REFERENCES `product_variants` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
);
