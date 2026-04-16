import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { VacationDialogComponent } from '../vacation-dialog/vacation-dialog.component';

export interface Recipient {
  id: string;
  email: string;
  display_name: string;
  sort_order: number;
  is_on_vacation: boolean;
  vacation_start: string | null;
  vacation_end: string | null;
}

@Component({
  selector: 'app-recipient-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, VacationDialogComponent],
  templateUrl: './recipient-manager.component.html'
})
export class RecipientManagerComponent {
  @Input() recipients: Recipient[] = [];
  @Output() recipientsChange = new EventEmitter<Recipient[]>();

  protected vacationDialogOpen = false;
  protected selectedRecipient: Recipient | null = null;
  protected draggedRecipientId: string | null = null;

  protected addRecipient(): void {
    const next: Recipient = {
      id: `temp-${Date.now()}`,
      email: '',
      display_name: '',
      sort_order: this.recipients.length,
      is_on_vacation: false,
      vacation_start: null,
      vacation_end: null
    };

    this.recipientsChange.emit([...this.recipients, next]);
  }

  protected updateRecipient(id: string, updates: Partial<Recipient>): void {
    this.recipientsChange.emit(
      this.recipients.map((recipient) =>
        recipient.id === id ? { ...recipient, ...updates } : recipient
      )
    );
  }

  protected deleteRecipient(id: string): void {
    this.recipientsChange.emit(
      this.recipients
        .filter((recipient) => recipient.id !== id)
        .map((recipient, index) => ({ ...recipient, sort_order: index }))
    );
  }

  protected handleRecipientDragStarted(id: string): void {
    this.draggedRecipientId = id;
  }

  protected handleRecipientDropped(targetId: string): void {
    if (!this.draggedRecipientId || this.draggedRecipientId === targetId) {
      return;
    }

    const oldIndex = this.recipients.findIndex((recipient) => recipient.id === this.draggedRecipientId);
    const newIndex = this.recipients.findIndex((recipient) => recipient.id === targetId);
    if (oldIndex === -1 || newIndex === -1) {
      this.draggedRecipientId = null;
      return;
    }

    const updated = [...this.recipients];
    const [movedRecipient] = updated.splice(oldIndex, 1);
    updated.splice(newIndex, 0, movedRecipient);
    this.recipientsChange.emit(updated.map((recipient, order) => ({ ...recipient, sort_order: order })));
    this.draggedRecipientId = null;
  }

  protected openVacationDialog(recipient: Recipient): void {
    this.selectedRecipient = recipient;
    this.vacationDialogOpen = true;
  }

  protected handleVacationSave(updates: Partial<Recipient>): void {
    if (this.selectedRecipient) {
      this.updateRecipient(this.selectedRecipient.id, updates);
    }
    this.vacationDialogOpen = false;
    this.selectedRecipient = null;
  }

  protected isCurrentlyOnVacation(recipient: Recipient): boolean {
    if (recipient.is_on_vacation) {
      return true;
    }

    if (recipient.vacation_start && recipient.vacation_end) {
      const now = new Date();
      return now >= new Date(recipient.vacation_start) && now <= new Date(recipient.vacation_end);
    }

    return false;
  }

  protected vacationBadgeClasses(recipient: Recipient): Record<string, boolean> {
    return {
      'border-warning/50 bg-warning/5': this.isCurrentlyOnVacation(recipient)
    };
  }
}
