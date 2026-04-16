export type MarkReplyStatus = 'loading' | 'preview' | 'confirming' | 'success' | 'already_replied' | 'error';

export interface MarkReplyPreviewResponse {
  status: 'pending' | 'success' | 'already_replied' | 'not_found' | 'error';
  email_subject: string | null;
}

export interface MarkReplyConfirmResponse {
  status: 'success' | 'already_replied' | 'not_found' | 'error';
  email_subject: string | null;
}
