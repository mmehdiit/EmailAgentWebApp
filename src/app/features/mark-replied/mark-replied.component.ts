import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { EMPTY, from } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

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
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly markReplyService: MarkReplyService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');

    if (!this.token) {
      this.status = 'error';
      this.message = 'Missing tracking token in URL';
      return;
    }

    from(this.markReplyService.preview(this.token))
      .pipe(
        tap((preview) => {
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
        }),
        catchError(() => {
          this.status = 'error';
          this.message = 'Failed to load email info. The link may be invalid or expired.';
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  protected handleConfirm(): void {
    if (!this.token) {
      return;
    }

    this.status = 'confirming';

    from(this.markReplyService.confirm(this.token))
      .pipe(
        tap((response) => {
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
        }),
        catchError(() => {
          this.status = 'error';
          this.message = 'Failed to mark email as replied. Please try again.';
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }
}
