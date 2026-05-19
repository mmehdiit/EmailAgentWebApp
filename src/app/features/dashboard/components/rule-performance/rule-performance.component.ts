import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, from } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';

import { RulePerformanceStat } from '@core/models/dashboard.models';
import { AnalyticsDataService } from '@core/services/analytics-data.service';

@Component({
  selector: 'app-rule-performance',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rule-performance.component.html'
})
export class RulePerformanceComponent implements OnInit {
  protected loading = true;
  protected stats: RulePerformanceStat[] = [];

  private readonly destroyRef = inject(DestroyRef);

  constructor(private readonly analyticsDataService: AnalyticsDataService) {}

  ngOnInit(): void {
    from(this.analyticsDataService.getAnalytics())
      .pipe(
        tap((analytics) => {
          this.stats = analytics.rulePerformance;
        }),
        catchError(() => {
          this.stats = [];
          return EMPTY;
        }),
        finalize(() => {
          this.loading = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  protected badgeClasses(stat: RulePerformanceStat): string {
    if (stat.successRate >= 80) {
      return 'bg-primary text-primary-foreground';
    }

    if (stat.successRate >= 50) {
      return 'bg-muted text-foreground';
    }

    return 'bg-destructive text-destructive-foreground';
  }
}
