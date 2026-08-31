import { Component, input, output } from '@angular/core';
import { MenuCategory } from '../../../../core/models/menu.models';

@Component({
  selector: 'app-category-nav',
  standalone: true,
  templateUrl: './category-nav.html',
  styleUrl: './category-nav.scss',
})
export class CategoryNav {
  categories = input.required<MenuCategory[]>();
  activeId = input<string | null>(null);
  categorySelected = output<string>();

  select(id: string): void {
    this.categorySelected.emit(id);
  }
}