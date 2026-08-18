-- L5 — Notifications in-app et push web
--
-- Une cliente n'était prévenue de rien. Commande enregistrée, statut qui change,
-- annulation : tout passait par un email — quand l'adresse était bonne — ou par
-- un appel téléphonique. Côté administration, une rupture de stock ne se voyait
-- qu'en ouvrant la fiche produit.

CREATE TABLE `notifications` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    BIGINT UNSIGNED NOT NULL,
  -- Chaîne et non ENUM : les types se multiplient au fil des fonctionnalités,
  -- et chaque ajout ne doit pas coûter une migration.
  `type`       VARCHAR(50) NOT NULL,
  `title`      VARCHAR(150) NOT NULL,
  `message`    TEXT NOT NULL,
  -- Chemin interne (/orders/12), jamais une URL absolue : le domaine change
  -- entre développement, recette et production.
  `link`       VARCHAR(500) NULL,
  `read_at`    TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  -- Le compteur de non-lues est la requête la plus fréquente de l'application.
  INDEX `notifications_user_id_read_at_index` (`user_id`, `read_at`),
  INDEX `notifications_user_id_created_at_index` (`user_id`, `created_at`),
  CONSTRAINT `notifications_user_id_foreign` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE TABLE `push_subscriptions` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    BIGINT UNSIGNED NOT NULL,
  -- Fourni par le navigateur ; identifie l'appareil de façon unique.
  `endpoint`   VARCHAR(500) NOT NULL,
  `p256dh`     VARCHAR(255) NOT NULL,
  `auth`       VARCHAR(255) NOT NULL,
  `user_agent` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `push_subscriptions_endpoint_unique` (`endpoint`),
  INDEX `push_subscriptions_user_id_index` (`user_id`),
  CONSTRAINT `push_subscriptions_user_id_foreign` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION
);
