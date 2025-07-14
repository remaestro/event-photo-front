import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-scan',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scan.component.html',
  styleUrl: './scan.component.css'
})
export class ScanComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement', { static: false }) videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement', { static: false }) canvasElement!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;

  eventId: string | null = null;
  isScanning = false;
  isProcessing = false;
  scanResult = false;
  totalPhotos = 247;
  foundPhotos = 0;
  
  // Camera and media states
  stream: MediaStream | null = null;
  cameraError = '';
  cameraSupported = false;
  
  // Progress tracking
  progressSteps = [
    { label: 'Initialisation du scan', completed: false },
    { label: 'Analyse du visage', completed: false },
    { label: 'Comparaison avec les photos', completed: false },
    { label: 'Génération des résultats', completed: false }
  ];
  currentStep = 0;
  
  // Upload states
  uploadedFile: File | null = null;
  uploadError = '';
  capturedPhoto: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private location: Location
  ) {
    this.eventId = this.route.snapshot.paramMap.get('eventId');
  }

  ngOnInit() {
    this.checkCameraSupport();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopCamera();
  }

  private checkCameraSupport() {
    this.cameraSupported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  goBack() {
    this.location.back();
  }

  async startCamera() {
    if (!this.cameraSupported) {
      this.cameraError = 'Caméra non supportée par votre navigateur';
      return;
    }

    this.cameraError = '';
    
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });
      
      this.isScanning = true;
      
      // Attendre que la vue soit mise à jour
      setTimeout(() => {
        if (this.videoElement && this.videoElement.nativeElement) {
          this.videoElement.nativeElement.srcObject = this.stream;
          this.videoElement.nativeElement.play();
        }
      }, 100);
      
    } catch (error) {
      console.error('Erreur lors de l\'accès à la caméra:', error);
      this.cameraError = 'Impossible d\'accéder à la caméra. Vérifiez les permissions.';
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.isScanning = false;
    this.capturedPhoto = null;
  }

  capturePhoto() {
    if (!this.videoElement || !this.canvasElement) return;

    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Définir la taille du canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Capturer l'image
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convertir en base64
    this.capturedPhoto = canvas.toDataURL('image/jpeg', 0.8);
    
    // Arrêter la caméra
    this.stopCamera();
    
    // Démarrer le traitement
    this.startProcessing();
  }

  uploadPhoto() {
    if (this.fileInput) {
      this.fileInput.nativeElement.click();
    }
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      this.uploadError = 'Veuillez sélectionner une image valide';
      return;
    }

    // Vérifier la taille (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      this.uploadError = 'L\'image ne doit pas dépasser 10MB';
      return;
    }

    this.uploadError = '';
    this.uploadedFile = file;

    // Créer une prévisualisation
    const reader = new FileReader();
    reader.onload = (e) => {
      this.capturedPhoto = e.target?.result as string;
      this.startProcessing();
    };
    reader.readAsDataURL(file);
  }

  startProcessing() {
    this.isProcessing = true;
    this.currentStep = 0;
    this.progressSteps.forEach(step => step.completed = false);

    // Simuler le processus étape par étape
    this.processStep(0);
  }

  private processStep(stepIndex: number) {
    if (stepIndex >= this.progressSteps.length) {
      // Processus terminé
      this.isProcessing = false;
      this.scanResult = true;
      this.foundPhotos = Math.floor(Math.random() * 20) + 5; // 5-25 photos trouvées
      return;
    }

    this.currentStep = stepIndex;
    
    // Simuler le traitement de l'étape
    setTimeout(() => {
      this.progressSteps[stepIndex].completed = true;
      
      // Passer à l'étape suivante après un délai
      setTimeout(() => {
        this.processStep(stepIndex + 1);
      }, 500);
    }, 1000 + Math.random() * 1000); // Entre 1 et 2 secondes par étape
  }

  getProgressPercentage(): number {
    const completedSteps = this.progressSteps.filter(step => step.completed).length;
    return (completedSteps / this.progressSteps.length) * 100;
  }

  viewResults() {
    // Générer un ID de session simulé
    const sessionId = 'session_' + Date.now();
    this.router.navigate(['/scan-results', sessionId]);
  }

  scanAgain() {
    this.scanResult = false;
    this.foundPhotos = 0;
    this.capturedPhoto = null;
    this.uploadedFile = null;
    this.uploadError = '';
    this.cameraError = '';
    this.progressSteps.forEach(step => step.completed = false);
    this.currentStep = 0;
  }

  // Méthodes utilitaires pour les conseils dynamiques
  getScanTips(): string[] {
    const tips = [
      'Assurez-vous d\'avoir un bon éclairage sur votre visage',
      'Regardez directement la caméra',
      'Évitez de porter des lunettes de soleil ou des masques',
      'Gardez une expression neutre',
      'Placez-vous à environ 50cm de la caméra'
    ];
    
    if (this.uploadedFile) {
      tips.push('Utilisez une photo récente et de bonne qualité');
      tips.push('Préférez les photos avec un seul visage visible');
    }
    
    return tips;
  }

  getFileTypeAccepted(): string {
    return 'image/jpeg,image/jpg,image/png,image/webp';
  }
}
