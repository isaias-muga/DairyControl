import { Component, ElementRef, effect, input, output, signal, untracked, viewChild } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';

/**
 * One-line, truncated observation shown inside a table cell. It is a real button (keyboard accessible):
 * the full text is in the hover tooltip, and a "ver más" affordance shows only when the text is cut.
 */
@Component({
  selector: 'app-observacion-celda',
  imports: [MatTooltipModule],
  templateUrl: './observacion-celda.html',
  styleUrl: './observacion-celda.css',
})
export class ObservacionCelda {
  texto = input<string | null>(null);
  abrir = output<void>();

  protected truncada = signal(false);
  private elementoTexto = viewChild<ElementRef<HTMLElement>>('texto');

  constructor() {
    effect((limpiar) => {
      this.texto(); // measure again when the text changes
      const elemento = this.elementoTexto()?.nativeElement;
      if (!elemento) {
        untracked(() => this.truncada.set(false));
        return;
      }

      const medir = () => this.truncada.set(elemento.scrollWidth > elemento.clientWidth);
      untracked(medir);

      if (typeof ResizeObserver === 'undefined') {
        return;
      }
      const observador = new ResizeObserver(medir);
      observador.observe(elemento);
      limpiar(() => observador.disconnect());
    });
  }
}
