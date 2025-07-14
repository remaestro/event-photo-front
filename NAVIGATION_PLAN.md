# 📱 Plan de Navigation - Event Photo Platform

## Vue d'ensemble de l'architecture

Cette application Angular avec Tailwind CSS suit une architecture basée sur les rôles utilisateur (Organisateurs et Administrateurs) avec une gestion granulaire des permissions sur les événements.

## 🎭 Rôles et Permissions

### Organisateur
- Peut créer et gérer ses propres événements
- Peut être ajouté comme bénéficiaire sur d'autres événements
- Voit uniquement les événements qu'il a créés ou auxquels il a été ajouté
- Peut uploader des photos pour ses événements
- Peut gérer les bénéficiaires de ses événements

### Administrateur
- Peut voir tous les événements de la plateforme
- Peut consulter toutes les données et statistiques
- Peut modérer le contenu
- Peut gérer les utilisateurs et leurs permissions
- Accès aux outils d'administration

## 🗺️ Structure de Navigation Principale

### 1. Navigation Globale (Header/Menu Principal)

```
Header Navigation
├── Logo / Accueil
├── Mes Événements (Organisateur)
├── Tous les Événements (Admin)
├── Comment ça marche
├── Connexion / Inscription
└── Profil Utilisateur (si connecté)
    ├── Mon Compte
    ├── Mes Photos (Organisateur)
    ├── Mes Événements (Organisateur)
    ├── Dashboard Admin (Admin)
    ├── Gestion Utilisateurs (Admin)
    └── Déconnexion
```

### 2. Pages Publiques (Avant Authentification)

#### 2.1 Page d'Accueil (`/`)
- **Objectif** : Point d'entrée principal
- **Contenu** :
  - Hero section avec proposition de valeur
  - CTA "Trouver mes photos" (Clients)
  - CTA "Créer un événement" (Organisateurs)
  - CTA "Administrer" (Admin)
  - Présentation des fonctionnalités
  - Événements récents/publics
  - Témoignages

#### 2.2 Recherche d'Événements (`/events/search`)
- **Objectif** : Découverte publique des événements
- **Contenu** :
  - Recherche par nom, code ou QR
  - Filtres publics
  - Accès aux événements publics
- **Actions** :
  - Rechercher → Accès événement public
  - Scanner code → Accès direct

#### 2.3 Accès Événement Public (`/events/:id/public`)
- **Objectif** : Accès public à un événement
- **Contenu** :
  - Informations publiques de l'événement
  - Interface de scan facial
  - Galerie publique (si activée)
- **Actions** :
  - Démarrer scan facial → Résultats
  - Connexion pour acheter

### 3. Pages d'Authentification

#### 3.1 Connexion (`/login`)
- Formulaire de connexion
- Lien vers inscription
- Options de récupération de mot de passe

#### 3.2 Inscription (`/register`)
- **Choix du rôle** : Organisateur ou Admin (avec validation)
- Formulaires spécifiques selon le rôle
- Conditions d'utilisation

#### 3.3 Choix du Rôle (`/role-selection`)
- **Organisateur** : "Je crée et gère des événements"
- **Administrateur** : "J'administre la plateforme"

## 📋 Parcours Organisateur

### 4. Pages Spécifiques Organisateurs

#### 4.1 Dashboard Organisateur (`/organizer/dashboard`)
- **Objectif** : Vue d'ensemble de l'activité
- **Contenu** :
  - Statistiques des événements créés
  - Événements où il est bénéficiaire
  - Revenus et ventes
  - Actions rapides

#### 4.2 Mes Événements (`/organizer/events`)
- **Objectif** : Gestion des événements
- **Contenu** :
  - Événements créés par l'organisateur
  - Événements où il est bénéficiaire
  - Statuts et permissions
- **Actions** :
  - Créer nouvel événement
  - Modifier événement
  - Gérer bénéficiaires

#### 4.3 Création d'Événement (`/organizer/events/create`)
- **Objectif** : Créer un nouvel événement
- **Contenu** :
  - Formulaire de création
  - Paramètres de visibilité
  - Ajout de bénéficiaires
  - Configuration des permissions

#### 4.4 Gestion Événement (`/organizer/events/:id/manage`)
- **Objectif** : Gérer un événement spécifique
- **Contenu** :
  - Informations de l'événement
  - Gestion des bénéficiaires
  - Statistiques de l'événement
  - Configuration des permissions

#### 4.5 Upload Photos (`/organizer/events/:id/upload`)
- **Objectif** : Ajout de photos à un événement
- **Contenu** :
  - Interface drag & drop
  - Métadonnées des photos
  - Prévisualisation
  - Traitement par lots

#### 4.6 Mes Photos (`/organizer/photos`)
- **Objectif** : Gestion du portfolio
- **Contenu** :
  - Toutes les photos uploadées
  - Filtres par événement
  - Statuts et statistiques de vente

#### 4.7 Bénéficiaires (`/organizer/beneficiaries`)
- **Objectif** : Gestion des bénéficiaires
- **Contenu** :
  - Liste des bénéficiaires ajoutés
  - Événements partagés
  - Permissions accordées

## 🔧 Parcours Administrateur

### 5. Pages Spécifiques Administrateurs

#### 5.1 Dashboard Admin (`/admin/dashboard`)
- **Objectif** : Vue d'ensemble de la plateforme
- **Contenu** :
  - Statistiques globales
  - Activité récente
  - Alertes et notifications
  - Métriques de performance

#### 5.2 Tous les Événements (`/admin/events`)
- **Objectif** : Gestion globale des événements
- **Contenu** :
  - Liste complète des événements
  - Filtres avancés
  - Statuts et modération
- **Actions** :
  - Voir détails
  - Modérer contenu
  - Gérer permissions

#### 5.3 Gestion Utilisateurs (`/admin/users`)
- **Objectif** : Administration des utilisateurs
- **Contenu** :
  - Liste des utilisateurs
  - Rôles et permissions
  - Statistiques d'utilisation
- **Actions** :
  - Modifier rôles
  - Suspendre/activer
  - Voir activité

#### 5.4 Modération (`/admin/moderation`)
- **Objectif** : Modération du contenu
- **Contenu** :
  - Photos en attente
  - Signalements
  - Contenu à modérer
- **Actions** :
  - Approuver/rejeter
  - Supprimer contenu
  - Gérer signalements

#### 5.5 Statistiques (`/admin/statistics`)
- **Objectif** : Analyses et métriques
- **Contenu** :
  - Graphiques de performance
  - Rapports détaillés
  - Exports de données

#### 5.6 Configuration (`/admin/settings`)
- **Objectif** : Paramètres de la plateforme
- **Contenu** :
  - Configuration générale
  - Paramètres de sécurité
  - Intégrations externes

## 👥 Gestion des Événements

### 6. Structure des Permissions

#### 6.1 Rôles sur un Événement
- **Organisateur** : Créateur de l'événement
- **Bénéficiaire** : Ajouté par l'organisateur
- **Administrateur** : Accès systématique

#### 6.2 Permissions par Rôle
```
Organisateur (créateur) :
├── Modifier les informations
├── Ajouter/retirer bénéficiaires
├── Uploader des photos
├── Gérer la visibilité
├── Voir les statistiques
└── Supprimer l'événement

Bénéficiaire :
├── Voir l'événement
├── Uploader des photos
├── Voir les statistiques partagées
└── Recevoir une part des revenus

Administrateur :
├── Voir tous les événements
├── Modérer le contenu
├── Gérer les permissions
├── Accéder aux statistiques
└── Résoudre les conflits
```

## 🔄 Flux de Navigation Critique

### Flux Organisateur Principal
```
Accueil → Connexion → Dashboard → Créer Événement → 
Upload Photos → Gérer Bénéficiaires
```

### Flux Admin Principal
```
Accueil → Connexion → Dashboard Admin → Tous les Événements → 
Modération → Gestion Utilisateurs
```

### Flux Client (Recherche de Photos)
```
Accueil → Recherche Événement → Scan Facial → 
Résultats → Achat → Téléchargement
```

## 🛡️ Gestion des Permissions

### Routes Protégées
- **Organisateurs** : `/organizer/*`
- **Administrateurs** : `/admin/*`
- **Propriétaires d'événements** : `/organizer/events/:id/*`
- **Bénéficiaires** : Accès partiel selon permissions

### Redirections
- **Non authentifié** → `/login`
- **Mauvais rôle** → Page d'erreur 403
- **Permissions insuffisantes** → Dashboard approprié

## 📊 Analytics et Tracking

### Points de mesure importants
- Conversion scan → achat
- Taux de création d'événements
- Utilisation des bénéficiaires
- Activité administrative

## 🚀 Fonctionnalités Futures

### Améliorations prévues
- **Système de notifications** entre organisateurs et bénéficiaires
- **Partage automatique des revenus**
- **API pour intégrations externes**
- **Rapports avancés**

---

*Ce plan de navigation servira de base pour l'implémentation du routing Angular et la structure des composants de l'application avec les nouveaux rôles.*