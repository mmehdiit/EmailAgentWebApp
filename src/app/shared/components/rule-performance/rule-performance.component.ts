import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { RulePerformanceStat } from '../../../core/models/dashboard.models';
import { AnalyticsDataService } from '../../../core/services/analytics-data.service';

@Component({
  selector: 'app-rule-performance',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rule-performance.component.html'
})
export class RulePerformanceComponent implements OnInit {
  protected loading = true;
  protected stats: RulePerformanceStat[] = [];

  constructor(private readonly analyticsDataService: AnalyticsDataService) {}

  async ngOnInit(): Promise<void> {
    const analytics = await this.analyticsDataService.getAnalytics();
    this.stats = analytics.rulePerformance;
    this.loading = false;
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
