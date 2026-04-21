import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-top-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './top-navbar.component.html',
})
export class TopNavbarComponent {
  @Input() authenticated = false;
  @Input() outlookConnected = false;
  @Input() outlookEmail: string | null = null;
  @Input() showHomeLink = true;
  @Input() showAuthLink = false;
  @Input() showLogout = false;
  @Input() showOutlookStatus = false;

  @Output() signOutRequested = new EventEmitter<void>();

  protected authLink(): string {
    return this.authenticated ? '/dashboard' : '/auth';
  }

  protected authLabel(): string {
    return this.authenticated ? 'Dashboard' : 'Login';
  }
}
