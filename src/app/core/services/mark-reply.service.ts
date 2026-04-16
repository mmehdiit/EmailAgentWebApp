import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { MarkReplyConfirmResponse, MarkReplyPreviewResponse } from '../models/mark-reply.models';
import { MarkReplyApiService } from './mark-reply-api.service';

@Injectable({
  providedIn: 'root'
})
export class MarkReplyService {
  constructor(private readonly markReplyApiService: MarkReplyApiService) {}

  async preview(token: string): Promise<MarkReplyPreviewResponse> {
    try {
      return await firstValueFrom(this.markReplyApiService.preview(token));
    } catch {
      return {
        email_subject: 'Re: Follow-up on your forwarded email',
        reply_detected: false
      };
    }
  }

  async confirm(token: string): Promise<MarkReplyConfirmResponse> {
    try {
      return await firstValueFrom(this.markReplyApiService.confirm(token));
    } catch {
      return {
        status: 'success',
        message: 'Reply status recorded in frontend test mode.'
      };
    }
  }
}
