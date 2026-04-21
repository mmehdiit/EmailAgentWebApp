import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toaster',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toaster.component.html'
})
export class ToasterComponent {
  protected readonly toasts$ = this.toastService.toasts$;

  constructor(private readonly toastService: ToastService) {}

  protected dismiss(id: string): void {
    this.toastService.dismiss(id);
  }
}
