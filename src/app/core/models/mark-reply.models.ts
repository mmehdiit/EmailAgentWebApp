export type MarkReplyStatus = 'loading' | 'preview' | 'confirming' | 'success' | 'already_replied' | 'error';

export interface MarkReplyPreviewResponse {
  email_subject: string | null;
  reply_detected: boolean;
}

export interface MarkReplyConfirmResponse {
  status: 'success' | 'already_replied';
  message: string;
}
