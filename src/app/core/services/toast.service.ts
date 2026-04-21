import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastVariant = 'default' | 'destructive';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly toastsSubject = new BehaviorSubject<ToastItem[]>([]);
  readonly toasts$ = this.toastsSubject.asObservable();

  show(toast: Omit<ToastItem, 'id'>): string {
    const id = this.generateId();
    const nextToast: ToastItem = { id, ...toast };

    this.toastsSubject.next([nextToast]);
    window.setTimeout(() => this.dismiss(id), 4000);

    return id;
  }

  error(description: string, title = 'Error'): string {
    return this.show({
      title,
      description,
      variant: 'destructive'
    });
  }

  success(description: string, title = 'Success'): string {
    return this.show({
      title,
      description,
      variant: 'default'
    });
  }

  dismiss(id: string): void {
    this.toastsSubject.next(
      this.toastsSubject.value.filter((toast) => toast.id !== id)
    );
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
