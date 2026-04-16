import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { Recipient } from '../recipient-manager/recipient-manager.component';

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

@Component({
  selector: 'app-sortable-rule-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sortable-rule-item.component.html'
})
export class SortableRuleItemComponent {
  @Input({ required: true }) rule!: SortableDashboardRule;
  @Input() index = 0;
  @Input() total = 0;

  @Output() edit = new EventEmitter<SortableDashboardRule>();
  @Output() toggleActive = new EventEmitter<string>();
  @Output() delete = new EventEmitter<string>();
  @Output() moveUp = new EventEmitter<string>();
  @Output() moveDown = new EventEmitter<string>();
  @Output() dragStarted = new EventEmitter<string>();
  @Output() dropped = new EventEmitter<string>();

  protected subjectKeywords(): string[] {
    return this.rule.subjectPattern
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
  }

  protected displayedSubjectKeywords(): string[] {
    return this.subjectKeywords().slice(0, 5);
  }

  protected remainingSubjectKeywords(): number {
    return Math.max(this.subjectKeywords().length - 5, 0);
  }

  protected availableRecipients(): Recipient[] {
    return this.rule.recipients.filter((recipient) => !recipient.is_on_vacation);
  }

  protected nextRecipient(): Recipient | null {
    const availableRecipients = this.availableRecipients();
    if (!this.rule.rotationEnabled || availableRecipients.length === 0) {
      return null;
    }

    return availableRecipients[0] ?? null;
  }

  protected handleDragStart(): void {
    this.dragStarted.emit(this.rule.id);
  }

  protected handleDrop(): void {
    this.dropped.emit(this.rule.id);
  }
}
