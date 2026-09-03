import { Component, ElementRef, HostListener, ViewChild, input, signal } from '@angular/core';

export interface RowAction {
  label: string;
  icon: string;
  handler: () => void;
  danger?: boolean;
}

@Component({
  selector: 'app-actions-menu',
  standalone: true,
  templateUrl: './actions-menu.html',
  styleUrl: './actions-menu.scss',
})
export class ActionsMenu {
  actions = input.required<RowAction[]>();
  open = signal(false);
  menuTop = signal(0);
  menuLeft = signal(0);

  @ViewChild('trigger') triggerRef!: ElementRef<HTMLButtonElement>;

  toggle(event: Event): void {
    event.stopPropagation();

    if (!this.open()) {
      const rect = this.triggerRef.nativeElement.getBoundingClientRect();
      const menuWidth = 180;
      this.menuLeft.set(Math.max(8, rect.right - menuWidth));
      this.menuTop.set(rect.bottom + 4);
    }

    this.open.set(!this.open());
  }

  runAction(action: RowAction): void {
    this.open.set(false);
    action.handler();
  }

  @HostListener('document:click')
  closeOnOutsideClick(): void {
    this.open.set(false);
  }

  @HostListener('window:scroll')
  closeOnScroll(): void {
    if (this.open()) this.open.set(false);
  }
}