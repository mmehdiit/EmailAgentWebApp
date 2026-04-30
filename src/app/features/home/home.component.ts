import { NgFor } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { from } from 'rxjs';
import { tap } from 'rxjs/operators';

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

  private readonly destroyRef = inject(DestroyRef);

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

  ngOnInit(): void {
    from(this.authSessionService.getSession())
      .pipe(
        tap((session) => {
          this.authenticated = session.authenticated;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  protected signOut(): void {
    this.authSessionService.logout();
    this.toastService.success(
      "You've been successfully logged out.",
      'Logged Out'
    );
    from(this.router.navigate(['/auth']))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }
}
