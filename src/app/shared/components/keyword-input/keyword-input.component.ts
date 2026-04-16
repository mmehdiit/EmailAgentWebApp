import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-keyword-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './keyword-input.component.html'
})
export class KeywordInputComponent {
  @Input() keywords: string[] = [];
  @Input() placeholder = 'Type and press Enter';
  @Input() variant: 'default' | 'destructive' = 'default';
  @Output() keywordsChange = new EventEmitter<string[]>();

  protected inputValue = '';

  protected addKeyword(value: string): void {
    const trimmed = value.trim();
    if (trimmed && !this.keywords.includes(trimmed)) {
      this.keywordsChange.emit([...this.keywords, trimmed]);
    }
    this.inputValue = '';
  }

  protected handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.addKeyword(this.inputValue);
    } else if (event.key === 'Backspace' && this.inputValue === '' && this.keywords.length > 0) {
      this.keywordsChange.emit(this.keywords.slice(0, -1));
    }
  }

  protected handleBlur(): void {
    if (this.inputValue.trim()) {
      this.addKeyword(this.inputValue);
    }
  }

  protected removeKeyword(index: number): void {
    this.keywordsChange.emit(this.keywords.filter((_, i) => i !== index));
  }
}
