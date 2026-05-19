export interface Recipient {
  id: string;
  email: string;
  display_name: string;
  sort_order: number;
  is_on_vacation: boolean;
  vacation_start: string | null;
  vacation_end: string | null;
}

export interface SortableDashboardRule {
  id: string;
  name: string;
  keywords: string[];
  negativeKeywords: string[];
  recipient: string;
  recipients: Recipient[];
  conditions: string;
  active: boolean;
  priority: number;
  senderPattern: string;
  subjectPattern: string;
  aiEnabled: boolean;
  aiContext: string;
  extractAttachments: boolean;
  rotationEnabled: boolean;
  smartThreadEnabled: boolean;
}
