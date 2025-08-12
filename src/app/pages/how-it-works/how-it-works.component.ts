import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-how-it-works',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './how-it-works.component.html',
  styleUrl: './how-it-works.component.css'
})
export class HowItWorksComponent {
  
  steps = [
    {
      id: 1,
      title: "Créer un événement",
      description: "L'organisateur crée un événement et invite des bénéficiaires à partager les revenus",
      icon: "📅",
      details: [
        "Définir les détails de l'événement (nom, date, lieu)",
        "Ajouter des bénéficiaires avec leur pourcentage de revenus",
        "Configurer les paramètres de vente et de téléchargement",
        "Générer un code QR unique pour l'événement"
      ]
    },
    {
      id: 2,
      title: "Uploader les photos",
      description: "Téléchargez facilement toutes vos photos d'événement avec notre système de traitement par lots",
      icon: "📸",
      details: [
        "Upload en lot de centaines de photos",
        "Traitement automatique et optimisation",
        "Organisation par événement",
        "Prévisualisation et gestion des photos"
      ]
    },
    {
      id: 3,
      title: "Partager le code d'accès",
      description: "Les participants utilisent le code d'événement ou scannent le QR code pour accéder aux photos",
      icon: "🔑",
      details: [
        "Code d'événement unique généré automatiquement",
        "QR code à afficher ou distribuer",
        "Accès direct via le code sur votre site",
        "Navigation facile dans toutes les photos"
      ]
    },
    {
      id: 4,
      title: "Achat et partage des revenus",
      description: "Les clients achètent leurs photos et les revenus sont automatiquement partagés entre tous les bénéficiaires",
      icon: "💰",
      details: [
        "Paiement sécurisé en ligne",
        "Téléchargement haute qualité immédiat",
        "Répartition automatique des revenus",
        "Suivi des ventes en temps réel"
      ]
    }
  ];

  features = [
    {
      title: "Code d'Accès Unique",
      description: "Chaque événement dispose d'un code unique pour un accès simple et sécurisé",
      icon: "🔑"
    },
    {
      title: "Partage de Revenus",
      description: "Répartition automatique des bénéfices entre organisateurs et bénéficiaires",
      icon: "💸"
    },
    {
      title: "Upload Massif",
      description: "Téléchargez des centaines de photos en une seule fois",
      icon: "⚡"
    },
    {
      title: "Paiements Sécurisés",
      description: "Transactions protégées et téléchargements instantanés",
      icon: "🔒"
    },
    {
      title: "QR Code Intégré",
      description: "Code QR automatique pour chaque événement pour faciliter l'accès",
      icon: "📱"
    },
    {
      title: "Dashboard Avancé",
      description: "Statistiques détaillées et gestion complète des événements",
      icon: "📊"
    }
  ];

  userTypes = [
    {
      type: "Organisateurs",
      description: "Photographes, organisateurs d'événements, studios photo",
      benefits: [
        "Gestion complète des événements",
        "Upload et organisation des photos",
        "Suivi des ventes et revenus",
        "Invitation de bénéficiaires",
        "Statistiques détaillées"
      ],
      icon: "👨‍💼"
    },
    {
      type: "Bénéficiaires",
      description: "Partenaires, assistants, prestataires de services",
      benefits: [
        "Partage automatique des revenus",
        "Accès aux statistiques",
        "Notifications de ventes",
        "Gestion de profil",
        "Historique des gains"
      ],
      icon: "🤝"
    },
    {
      type: "Clients",
      description: "Participants aux événements, familles, invités",
      benefits: [
        "Accès facile avec code d'événement",
        "Achat sécurisé en ligne",
        "Téléchargement haute qualité",
        "Navigation mobile optimisée",
        "Partage sur réseaux sociaux"
      ],
      icon: "👥"
    }
  ];

  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
