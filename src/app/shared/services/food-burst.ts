import { Injectable } from '@angular/core';

const EMOJIS = ['🍱', '🍕', '🍔', '🍜', '🍲', '🌮', '🍨', '🍹'];

/**
 * Dispara una ráfaga de emojis de comida desde un elemento dado.
 *
 * Los <span> se crean con document.createElement y se cuelgan de
 * document.body — es decir, FUERA del árbol que Angular renderiza
 * para cualquier componente. Por eso el CSS (.burst / @keyframes
 * burst-fly) vive en el stylesheet GLOBAL del proyecto (styles.css,
 * el que está listado en angular.json > "styles"), nunca en el
 * .css/.scss de un componente: la encapsulación de estilos de
 * Angular solo aplica las reglas de un componente a los nodos que
 * ESE componente pintó, y un span pegado a <body> no califica.
 */
@Injectable({ providedIn: 'root' })
export class FoodBurstService {
  trigger(el: HTMLElement): void {
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    for (let i = 0; i < 8; i++) {
      const span = document.createElement('span');
      span.className = 'burst';
      span.textContent = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
      span.style.left = cx + 'px';
      span.style.top = cy + 'px';

      const angle = Math.random() * Math.PI * 2;
      const dist = 44 + Math.random() * 48;
      span.style.setProperty(
        '--fly',
        `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist - 24}px)`
      );
      span.style.setProperty('--rot', Math.random() * 70 - 35 + 'deg');
      span.style.animation = 'burst-fly 0.75s ease-out forwards';

      document.body.appendChild(span);
      setTimeout(() => span.remove(), 780);
    }
  }
}