import { Component, computed, input } from '@angular/core';
import { Skeleton } from '../skeleton/skeleton';

/**
 * Esqueleto de una tabla admin (Categorías, Productos, Mesas, Usuarios
 * comparten esta misma forma). No es una tabla real — imita el
 * <table class="table"> de _admin-page.scss con filas de bloques
 * <app-skeleton>, así que al terminar de cargar el cambio a la tabla
 * real no da un salto brusco de tamaño.
 *
 * Uso: <app-table-skeleton [rows]="5" [cols]="4"></app-table-skeleton>
 */
@Component({
  selector: 'app-table-skeleton',
  standalone: true,
  imports: [Skeleton],
  templateUrl: './table-skeleton.html',
  styleUrl: './table-skeleton.scss',
})
export class TableSkeleton {
  rows = input<number>(5);
  cols = input<number>(4);

  rowsArray = computed(() => Array.from({ length: this.rows() }));
  colsArray = computed(() => Array.from({ length: this.cols() }));
}
