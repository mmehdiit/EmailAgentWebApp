import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Recipient } from '../recipient-manager/recipient-manager.component';

@Component({
  selector: 'app-vacation-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vacation-dialog.component.html'
})
export class VacationDialogComponent implements OnChanges {
  @Input() open = false;
  @Input() recipient: Recipient | null = null;
  @Output() openChange = new EventEmitter<boolean>();
  @Output() save = new EventEmitter<Partial<Recipient>>();

  protected isOnVacation = false;
  protected vacationStart = '';
  protected vacationEnd = '';

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['recipient'] || changes['open']) && this.recipient) {
      this.isOnVacation = this.recipient.is_on_vacation;
      this.vacationStart = this.toDateInput(this.recipient.vacation_start);
      this.vacationEnd = this.toDateInput(this.recipient.vacation_end);
    }
  }

  protected close(): void {
    this.openChange.emit(false);
  }

  protected handleSave(): void {
    this.save.emit({
      is_on_vacation: this.isOnVacation,
      vacation_start: this.vacationStart ? new Date(this.vacationStart).toISOString() : null,
      vacation_end: this.vacationEnd ? new Date(this.vacationEnd).toISOString() : null
    });
  }

  protected clearDates(): void {
    this.vacationStart = '';
    this.vacationEnd = '';
  }

  private toDateInput(value: string | null): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')}`;
  }
}
