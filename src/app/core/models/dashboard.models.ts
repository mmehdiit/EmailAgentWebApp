export interface DashboardStats {
  totalProcessed: number;
  forwardedToday: number;
  successRate: number;
}

export interface DashboardRule {
  id: string;
  name: string;
  keywords: string[];
  active: boolean;
  priority: number;
}

export interface DashboardEmailLog {
  id: string;
  emailFrom: string;
  emailSubject: string;
  status: 'forwarded' | 'no_match' | 'failed' | 'replied';
  aiClassified: boolean;
  replyDetected: boolean;
}

export interface DashboardConnectionStatus {
  connected: boolean;
  email: string | null;
  nextProcessInSeconds: number;
}

export interface DashboardProcessResult {
  success: boolean;
  message: string;
}

export interface OutlookConnectResult {
  success: boolean;
  email: string | null;
  authUrl?: string | null;
  message: string;
}

export interface DashboardOverview {
  stats: DashboardStats;
  rules: DashboardRule[];
  recentLogs: DashboardEmailLog[];
  connection: DashboardConnectionStatus;
}

export interface EmailAnalyticsSummary {
  total: number;
  forwarded: number;
  replied: number;
  pending: number;
  noMatch: number;
  failed: number;
  aiClassified: number;
  avgResponseTime: string;
}

export interface EmailAnalyticsLog {
  id: string;
  date: string;
  from: string;
  subject: string;
  status: 'forwarded' | 'failed' | 'no_match' | 'success' | 'skipped' | string;
  ruleName?: string | null;
  forwardedTo?: string | null;
  replyDetected: boolean;
  aiClassified: boolean;
  responseTime?: string | null;
  aiConfidence?: number | null;

  outlookMessageId?: string | null;
  replySource?: 'manual' | 'outlook' | 'system' | string | null;
  processedAt?: string | null;
  repliedAt?: string | null;
  receivedAt?: string | null;
}
export interface ReplyAnalyticsStats {
  totalForwarded: number;
  replied: number;
  pending: number;
  replyRate: number;
  avgResponseTimeHours: number | null;
}

export interface RuleItem {
  id: string;
  name: string;
}

export interface EmailContent {
  subject?: string;
  from?: string;
  to?: string;
  cc?: string;
  receivedAt?: string;
  bodyHtml?: string;
  bodyText?: string;
}

export interface RulePerformanceStat {
  ruleId: string;
  ruleName: string;
  totalMatched: number;
  forwarded: number;
  failed: number;
  successRate: number;
  lastMatched: string | null;
}

export interface DashboardAnalytics {
  summary: EmailAnalyticsSummary;
  logs: EmailAnalyticsLog[];
  replyStats: ReplyAnalyticsStats;
  rulePerformance: RulePerformanceStat[];
}

export interface UnprocessedEmail {
  id: string;
  subject: string;
  from: string;
  fromName: string;
  receivedAt: string;
  preview: string;
  isRead: boolean;
  matchesRule: boolean;
  matchedRuleName: string | null;
  aiClassified?: boolean;
  aiConfidence?: number | null;
  aiReasoning?: string | null;
}

export interface ActiveForwardingRule {
  id: string;
  name: string;
  recipientEmail: string;
  active: boolean;
}

export interface UnreadEmailOverview {
  emails: UnprocessedEmail[];
  rules: ActiveForwardingRule[];
}

export interface UserRoleOption {
  value: 'user' | 'admin';
  label: string;
}

export interface CreateUserPayload {
  email: string;
  password: string;
  role: 'user' | 'admin';
}

export interface CreateUserResponse {
  success: boolean;
  message: string;
}
