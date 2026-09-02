import { Component, input } from '@angular/core';

/**
 * Un solo bloque de skeleton — el "ladrillo" con el que se arma el
 * loading de cualquier página. No sabe nada del contenido real: cada
 * página decide cuántos, de qué tamaño y cómo acomodarlos para que
 * se parezcan a lo que va a cargar ahí (una fila de tabla, una
 * tarjeta, un párrafo...). Eso es lo que varía por página; el
 * shimmer y el look es siempre el mismo, desde acá.
 *
 * Uso:
 *   <app-skeleton width="60%" height="14px"></app-skeleton>
 *   <app-skeleton width="40px" height="40px" [circle]="true"></app-skeleton>
 */
@Component({
  selector: 'app-skeleton',
  standalone: true,
  templateUrl: './skeleton.html',
  styleUrl: './skeleton.scss',
})
export class Skeleton {
  width = input<string>('100%');
  height = input<string>('14px');
  radius = input<string>('6px');
  circle = input<boolean>(false);
}
