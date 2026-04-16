import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { MarkReplyStatus } from '../../core/models/mark-reply.models';
import { MarkReplyService } from '../../core/services/mark-reply.service';

@Component({
  selector: 'app-mark-replied',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mark-replied.component.html',
  styleUrl: './mark-replied.component.scss'
})
export class MarkRepliedComponent implements OnInit {
  protected status: MarkReplyStatus = 'loading';
  protected message = '';
  protected emailSubject: string | null = null;

  private token: string | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly markReplyService: MarkReplyService
  ) {}

  async ngOnInit(): Promise<void> {
    this.token = this.route.snapshot.queryParamMap.get('token');

    if (!this.token) {
      this.status = 'error';
      this.message = 'Missing tracking token in URL';
      return;
    }

    try {
      const preview = await this.markReplyService.preview(this.token);
      this.emailSubject = preview.email_subject;

      if (preview.status === 'already_replied' || preview.status === 'success') {
        this.status = 'already_replied';
        this.message = 'This email was already marked as replied';
        return;
      }

      if (preview.status !== 'pending') {
        this.status = 'error';
        this.message = 'Failed to load email info. The link may be invalid or expired.';
        return;
      }

      this.status = 'preview';
      this.message = 'Click the button below to confirm you have replied to this email.';
    } catch {
      this.status = 'error';
      this.message = 'Failed to load email info. The link may be invalid or expired.';
    }
  }

  protected async handleConfirm(): Promise<void> {
    if (!this.token) {
      return;
    }

    this.status = 'confirming';

    try {
      const response = await this.markReplyService.confirm(this.token);
      this.emailSubject = response.email_subject;
      this.status =
        response.status === 'success' || response.status === 'already_replied'
          ? response.status
          : 'error';
      this.message =
        response.status === 'success'
          ? 'Reply successfully recorded.'
          : response.status === 'already_replied'
            ? 'This email was already marked as replied.'
            : 'Failed to mark email as replied. The link may be invalid or expired.';
    } catch {
      this.status = 'error';
      this.message = 'Failed to mark email as replied. Please try again.';
    }
  }
}
