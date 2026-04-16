import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { ReplyAnalyticsStats } from '../../../core/models/dashboard.models';
import { AnalyticsDataService } from '../../../core/services/analytics-data.service';

@Component({
  selector: 'app-reply-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reply-analytics.component.html'
})
export class ReplyAnalyticsComponent implements OnInit {
  protected loading = true;
  protected checking = false;
  protected stats: ReplyAnalyticsStats | null = null;

  constructor(private readonly analyticsDataService: AnalyticsDataService) {}

  async ngOnInit(): Promise<void> {
    await this.loadStats();
  }

  protected async loadStats(): Promise<void> {
    this.loading = true;
    const analytics = await this.analyticsDataService.getAnalytics();
    this.stats = analytics.replyStats;
    this.loading = false;
  }

  protected async checkReplies(): Promise<void> {
    this.checking = true;
    try {
      await this.analyticsDataService.checkReplies();
      await this.loadStats();
    } finally {
      this.checking = false;
    }
  }
}
