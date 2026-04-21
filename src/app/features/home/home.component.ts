import { NgFor } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthSessionService } from '../../core/services/auth-session.service';
import { ToastService } from '../../core/services/toast.service';
import { TopNavbarComponent } from '../../shared/components/top-navbar/top-navbar.component';

type HomeStep = {
  step: number;
  title: string;
  desc: string;
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [NgFor, RouterLink, TopNavbarComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  protected authenticated = false;
  protected outlookConnected = false;
  protected outlookEmail: string | null = null;

  constructor(
    private readonly authSessionService: AuthSessionService,
    private readonly toastService: ToastService,
    private readonly router: Router
  ) {}

  protected readonly steps: HomeStep[] = [
    {
      step: 1,
      title: 'Connect Outlook',
      desc: 'Securely link your Outlook account',
    },
    {
      step: 2,
      title: 'Define Rules',
      desc: 'Set up forwarding instructions with keywords and recipients',
    },
    {
      step: 3,
      title: 'Let AI Work',
      desc: 'AI analyzes emails and forwards them automatically',
    },
  ];

  async ngOnInit(): Promise<void> {
    const session = await this.authSessionService.getSession();
    this.authenticated = session.authenticated;
  }

  protected async signOut(): Promise<void> {
    this.authSessionService.logout();
    this.toastService.success(
      "You've been successfully logged out.",
      'Logged Out'
    );
    await this.router.navigate(['/auth']);
  }
}
