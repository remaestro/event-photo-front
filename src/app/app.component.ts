import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavigationComponent } from './shared/components/navigation/navigation.component';
import { NotificationComponent } from './shared/components/notification/notification.component';
import { AccessibilityPanelComponent } from './shared/components/accessibility-panel/accessibility-panel.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, 
    NavigationComponent, 
    NotificationComponent, 
    AccessibilityPanelComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'EventPhoto - Plateforme de Photos d\'Événements';
}
