import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

export type SelectDropdownOption = {
  label: string;
  value: string;
  description?: string;
};

@Component({
  selector: 'app-select-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app-select-dropdown.component.html',
})
export class AppSelectDropdownComponent {
  @Input({ required: true }) options: SelectDropdownOption[] = [];
  @Input() value = '';
  @Input() placeholder = 'Select option';
  @Input() buttonClass = '';

  @Output() valueChange = new EventEmitter<string>();
  @Output() selectionChange = new EventEmitter<string>();

  protected open = false;

  protected selectedOption(): SelectDropdownOption | null {
    return this.options.find((option) => option.value === this.value) ?? null;
  }

  protected toggle(event: MouseEvent): void {
    event.stopPropagation();
    this.open = !this.open;
  }

  protected selectOption(option: SelectDropdownOption): void {
    this.value = option.value;
    this.valueChange.emit(option.value);
    this.selectionChange.emit(option.value);
    this.open = false;
  }

  @HostListener('document:click')
  protected close(): void {
    this.open = false;
  }
}
