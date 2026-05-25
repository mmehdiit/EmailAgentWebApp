import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, from } from 'rxjs';
import { catchError, finalize, switchMap, tap } from 'rxjs/operators';

import { ReplyAnalyticsStats } from '@core/models/dashboard.models';
import { AnalyticsDataService } from '@core/services/analytics-data.service';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-reply-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reply-analytics.component.html'
})
export class ReplyAnalyticsComponent implements OnInit, OnChanges {
  @Input() refreshToken = 0;
  protected loading = true;
  protected checking = false;
  protected stats: ReplyAnalyticsStats | null = null;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly analyticsDataService: AnalyticsDataService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['refreshToken'] && !changes['refreshToken'].firstChange) {
      this.loadStats();
    }
  }

  protected loadStats(): void {
    this.loading = true;

    from(this.analyticsDataService.getAnalytics())
      .pipe(
        tap((analytics) => {
          this.stats = analytics.replyStats;
        }),
        catchError(() => EMPTY),
        finalize(() => {
          this.loading = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  protected checkReplies(): void {
    this.checking = true;

    from(this.analyticsDataService.checkReplies())
      .pipe(
        tap(() => {
          this.toastService.success(
            'Reply check completed successfully.',
            'Reply Check Complete'
          );
        }),
        switchMap(() => from(this.analyticsDataService.getAnalytics())),
        tap((analytics) => {
          this.stats = analytics.replyStats;
        }),
        catchError(() => EMPTY),
        finalize(() => {
          this.checking = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }
}
