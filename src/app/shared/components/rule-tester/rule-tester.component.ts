import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Recipient } from '../recipient-manager/recipient-manager.component';

export interface RuleTesterRule {
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
  rotationEnabled: boolean;
  smartThreadEnabled: boolean;
}

type TestResult = {
  rule: RuleTesterRule;
  matched: boolean;
  matchedKeywords: string[];
  matchType: 'exact' | 'ai' | 'none';
  excludedByNegative?: boolean;
  skippedByFollowUp?: boolean;
};

type FakeAiResult = {
  matched_rule_id: string | null;
  matched_rule_name: string | null;
  confidence: number;
  reasoning: string;
};

@Component({
  selector: 'app-rule-tester',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rule-tester.component.html'
})
export class RuleTesterComponent {
  @Input() rules: RuleTesterRule[] = [];

  protected open = false;
  protected isLoading = false;
  protected aiResult: FakeAiResult | null = null;
  protected testResults: TestResult[] | null = null;
  protected testEmail = {
    from: '',
    subject: '',
    body: ''
  };

  protected async runTest(): Promise<void> {
    this.isLoading = true;
    this.aiResult = null;

    const exactResults = this.runExactMatch();
    const hasExactMatch = exactResults.some((result) => result.matched);

    if (!hasExactMatch && (this.testEmail.subject || this.testEmail.body)) {
      const aiMatchedRule = [...this.rules]
        .filter((rule) => rule.aiEnabled)
        .sort((a, b) => b.priority - a.priority)[0];

      if (aiMatchedRule) {
        this.aiResult = {
          matched_rule_id: aiMatchedRule.id,
          matched_rule_name: aiMatchedRule.name,
          confidence: 0.78,
          reasoning: 'Frontend test mode selected the highest priority AI-enabled rule as a fallback.'
        };

        this.testResults = exactResults.map((result) => ({
          ...result,
          matched: result.rule.id === aiMatchedRule.id,
          matchType: result.rule.id === aiMatchedRule.id ? 'ai' : 'none'
        }));

        this.isLoading = false;
        return;
      }
    }

    this.testResults = exactResults;
    this.isLoading = false;
  }

  protected clearTest(): void {
    this.testEmail = { from: '', subject: '', body: '' };
    this.testResults = null;
    this.aiResult = null;
  }

  protected hasPriorMatch(index: number): boolean {
    return !!this.testResults?.slice(0, index).some((result) => result.matched);
  }

  protected isPrimaryMatch(result: TestResult, index: number): boolean {
    return result.matched && !this.hasPriorMatch(index);
  }

  protected isAiPrimaryMatch(result: TestResult, index: number): boolean {
    return this.isPrimaryMatch(result, index) && result.matchType === 'ai';
  }

  protected isExactPrimaryMatch(result: TestResult, index: number): boolean {
    return this.isPrimaryMatch(result, index) && result.matchType === 'exact';
  }

  protected isSkippedMatch(result: TestResult, index: number): boolean {
    return result.matched && this.hasPriorMatch(index);
  }

  protected resultClasses(result: TestResult, index: number): Record<string, boolean> {
    return {
      'border-accent/50 bg-accent/5': this.isAiPrimaryMatch(result, index),
      'border-success/50 bg-success/5': this.isExactPrimaryMatch(result, index),
      'border-warning/50 bg-warning/5': this.isSkippedMatch(result, index),
      'border-muted bg-muted/30': !result.matched
    };
  }

  protected forwardedRuleCount(): number {
    if (!this.testResults) {
      return 0;
    }

    return this.testResults.filter((result, index) => this.isPrimaryMatch(result, index)).length;
  }

  private runExactMatch(): TestResult[] {
    const effectiveBody = this.extractEffectiveBody(this.testEmail.body);
    const emailContent = `${this.testEmail.subject} ${effectiveBody}`.toLowerCase();
    const normalizedContentForNegative = this.testEmail.subject
      .toLowerCase()
      .replace(/[\r\n]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const emailSubject = this.testEmail.subject.toLowerCase();
    const senderEmail = this.testEmail.from.toLowerCase();
    const primaryBodyLower = effectiveBody
      .toLowerCase()
      .replace(/[\r\n]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const followUpPatterns = [
      /\burgent\s+update\b/i,
      /\bstatus\s+update\b/i,
      /\bapproval\s+status\b/i,
      /\bfinal\s+lpo\b/i,
      /\bcollection\s+of\s+vehicle/i,
      /\bvehicle\s+collection\b/i,
      /\bsettled\s+amount\b/i,
      /\bcar\s+rental\b/i,
      /\bsurvey\s+report\b/i,
      /\brepair\s+estimate\b/i,
      /\blpo\b/i,
      /\bgarage\s+authori[sz]ation\b/i,
      /\bkindly\s+(?:request|provide|share|send)\s+.*(?:update|status|approval)/i,
      /\bfollow\s*-?\s*up\b/i
    ];

    const hasFollowUpIntent = followUpPatterns.some((pattern) => pattern.test(primaryBodyLower));
    const sortedRules = [...this.rules].sort((a, b) => b.priority - a.priority);

    return sortedRules.map((rule) => {
      const isNewClaimsRule = rule.name.toLowerCase().includes('new claim');
      if (hasFollowUpIntent && isNewClaimsRule) {
        return {
          rule,
          matched: false,
          matchedKeywords: [],
          matchType: 'none' as const,
          skippedByFollowUp: true
        };
      }

      if (rule.negativeKeywords.length > 0) {
        const hasNegativeMatch = rule.negativeKeywords.some((keyword) => {
          const normalized = keyword.toLowerCase().replace(/\s+/g, ' ').trim();
          return normalized && normalizedContentForNegative.includes(normalized);
        });

        if (hasNegativeMatch) {
          return {
            rule,
            matched: false,
            matchedKeywords: [],
            matchType: 'none' as const,
            excludedByNegative: true
          };
        }
      }

      let matched = false;
      const matchedKeywords: string[] = [];

      if (rule.senderPattern && senderEmail) {
        const senderPattern = rule.senderPattern.toLowerCase();
        if (senderPattern.startsWith('@')) {
          matched = senderEmail.endsWith(senderPattern) || senderEmail.includes(senderPattern);
        } else if (senderPattern.includes('*@')) {
          const domain = senderPattern.replace('*@', '@');
          matched = senderEmail.endsWith(domain);
        } else {
          matched = senderEmail === senderPattern;
        }
      }

      if (!matched && rule.subjectPattern && emailSubject) {
        matched = emailSubject.includes(rule.subjectPattern.toLowerCase());
      }

      if (!matched && rule.keywords.length > 0) {
        rule.keywords.forEach((keyword) => {
          if (emailContent.includes(keyword.toLowerCase())) {
            matched = true;
            matchedKeywords.push(keyword);
          }
        });
      }

      return {
        rule,
        matched,
        matchedKeywords,
        matchType: matched ? ('exact' as const) : ('none' as const)
      };
    });
  }

  private stripSignature(text: string): string {
    if (!text) {
      return '';
    }

    const lines = text.split('\n');
    let cutIndex = lines.length;
    for (let i = lines.length - 1; i >= 0; i -= 1) {
      const line = lines[i].trim();
      if (
        line === '--' ||
        line === '---' ||
        /^[-_=]{3,}$/.test(line) ||
        /^regards,?\s*$/i.test(line) ||
        /^best regards,?\s*$/i.test(line) ||
        /^kind regards,?\s*$/i.test(line) ||
        /^thanks,?\s*$/i.test(line) ||
        /^thank you,?\s*$/i.test(line)
      ) {
        cutIndex = i;
        break;
      }
    }

    return lines.slice(0, cutIndex).join('\n').trim();
  }

  private extractPrimaryMessage(text: string): string {
    if (!text) {
      return '';
    }

    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i].trim();
      if (
        /^-{2,}\s*Original Message\s*-{2,}/i.test(line) ||
        /^-{2,}\s*Forwarded message\s*-{2,}/i.test(line) ||
        /^From:\s+.+/i.test(line) ||
        /^On\s+.+wrote:\s*$/i.test(line) ||
        /^_{5,}/.test(line) ||
        /^>{1,}\s/.test(line)
      ) {
        return lines.slice(0, i).join('\n').trim();
      }
    }

    return text;
  }

  private extractEffectiveBody(fullBodyText: string): string {
    const strippedBody = this.stripSignature(fullBodyText);
    const primaryBody = this.extractPrimaryMessage(strippedBody);

    if (primaryBody && primaryBody.length > 30) {
      return primaryBody;
    }

    return strippedBody;
  }
}
