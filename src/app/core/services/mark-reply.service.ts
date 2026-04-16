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
    return await firstValueFrom(this.markReplyApiService.preview(token));
  }

  async confirm(token: string): Promise<MarkReplyConfirmResponse> {
    return await firstValueFrom(this.markReplyApiService.confirm(token));
  }
}
