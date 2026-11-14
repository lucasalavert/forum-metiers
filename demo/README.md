# Jeu de Données de Démonstration / Full Demo Dataset (`demo/`)

Ce dossier contient un jeu de données réaliste complet permettant de tester l'ensemble de la plateforme (**catalogue des ateliers, portail élève, algorithme de répartition `SolverEngine`, heatmaps ECharts, arbitrage manuel et feuilles d'émargement**) en moins de 30 secondes depuis l'interface d'administration, sans aucune ligne de commande.

---

## 📦 Contenu du dossier `demo/`

| Fichier | Contenu | Détails |
| :--- | :--- | :--- |
| [`formations.csv`](./formations.csv) | **40 ateliers métiers** (`FOR-01` à `FOR-40`) | 10 domaines d'orientation, intervenants, salles, niveaux cibles (`2NDE,1ERE,TERM` ou `1ERE,TERM`) et capacités par rotation (`20` à `25` places). |
| [`students.csv`](./students.csv) | **450 élèves** répartis dans **15 classes** | 5 classes de Seconde (`2nde 1` à `2nde 5`), 5 de Première (`1ère 1` à `1ère 5`), 5 de Terminale (`Term 1` à `Term 5`), avec règles de spécialités pré-configurées (`1,2` pour `2nde 1-2`, `3,4` pour `2nde 3-4`, `AUTO` pour `2nde 5`). |
| [`wishes.csv`](./wishes.csv) | **2 400 vœux classés** (100 % des élèves) | 4 vœux ordonnés par élève de `2NDE`, 6 vœux par élève de `1ERE` et `TERM`, incluant des pics de tension réalistes sur les ateliers phares (Médecine `FOR-01`, Informatique/IA `FOR-07`, Droit `FOR-14`, Vétérinaire `FOR-04`, Architecture `FOR-28`). |

---

## 🚀 Procédure d'importation en 3 clics (Interface Admin)

1. Connectez-vous à l'espace d'administration (`/admin/login`).
2. **Étape 1 — Importer les 40 ateliers** :
   - Ouvrez **Formations & Quotas (`/admin/formations`)**.
   - Cliquez sur **« Importer CSV »** et sélectionnez [`demo/formations.csv`](./formations.csv).
3. **Étape 2 — Importer les 450 élèves et leurs 15 classes** :
   - Ouvrez **Élèves & Liens (`/admin/students`)**.
   - Cliquez sur **« Importer des élèves (CSV) »** et sélectionnez [`demo/students.csv`](./students.csv).
4. **Étape 3 — Importer les 2 400 vœux de démonstration** :
   - Toujours dans **Élèves & Liens (`/admin/students`)**, cliquez sur **« Importer des vœux (CSV) »** et sélectionnez [`demo/wishes.csv`](./wishes.csv).
5. **Étape 4 — Lancer le solveur de répartition** :
   - Ouvrez **Arbitrage & Répartition (`/admin/arbitrage`)** et cliquez sur **« Lancer la répartition »**.
   - Consultez ensuite les taux de satisfaction (vœu 1 / vœu 2), la heatmap d'occupation des salles et les feuilles d'émargement dans **Résultats & Émargement (`/admin/results`)**.
