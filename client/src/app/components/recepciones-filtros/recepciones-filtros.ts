import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { FECHA_MIN, RESUMEN_MAX_DIAS, TICKET_MAX, TICKET_MIN } from '../../models/limits';
import { Proveedor } from '../../models/proveedor';
import { FiltroRecepciones } from '../../models/recepcion-listado';
import {
  AtajoPeriodo,
  atajoDeRango,
  dateAIso,
  diasEnRango,
  hoyEnPlanta,
  isoADate,
  rangoDeAtajo,
} from '../../utils/periodos';

/** Filters of the recepciones list: quick period, custom range, proveedor, ticket and "solo fuera de rango". */
@Component({
  selector: 'app-recepciones-filtros',
  imports: [
    ReactiveFormsModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './recepciones-filtros.html',
  styleUrl: './recepciones-filtros.css',
})
export class RecepcionesFiltros {
  private fb = inject(FormBuilder).nonNullable;

  filtros = input.required<FiltroRecepciones>();
  /** The proveedores to choose from; null hides the selector (the proveedor is fixed by the page). */
  proveedores = input<Proveedor[] | null>(null);
  cambio = output<FiltroRecepciones>();

  protected readonly TODOS = 'todos'; // value of the "Todos" option (mat-select ignores null as a selection)
  protected readonly ticketMax = TICKET_MAX;

  protected atajo = computed<AtajoPeriodo | null>(() =>
    atajoDeRango({ desde: this.filtros().desde, hasta: this.filtros().hasta }, hoyEnPlanta()),
  );
  protected errorRango = signal<string | null>(null);

  protected rangoForm = this.fb.group({
    inicio: this.fb.control<Date | null>(null),
    fin: this.fb.control<Date | null>(null),
  });
  protected proveedorControl = this.fb.control<string>(this.TODOS);
  protected ticketControl = this.fb.control<string>('', [
    Validators.pattern(/^\d+$/),
    (c) => (c.value === '' || (Number(c.value) >= TICKET_MIN && Number(c.value) <= TICKET_MAX) ? null : { rango: true }),
  ]);
  protected soloControl = this.fb.control(false);

  constructor() {
    // The URL is the source of truth: whenever the filters change from outside, the controls follow.
    effect(() => {
      const f = this.filtros();
      this.rangoForm.setValue(
        { inicio: isoADate(f.desde), fin: isoADate(f.hasta) },
        { emitEvent: false },
      );
      this.proveedorControl.setValue(f.proveedorId ?? this.TODOS, { emitEvent: false });
      this.soloControl.setValue(!!f.soloFueraDeRango, { emitEvent: false });
      const ticket = f.ticket != null ? String(f.ticket) : '';
      if (this.ticketControl.value !== ticket) {
        this.ticketControl.setValue(ticket, { emitEvent: false });
      }
    });

    this.ticketControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => {
        if (this.ticketControl.valid) {
          this.emitir({ ticket: this.ticketControl.value === '' ? null : Number(this.ticketControl.value) });
        }
      });
  }

  protected seleccionarAtajo(atajo: AtajoPeriodo | undefined): void {
    if (!atajo) {
      return;
    }
    this.errorRango.set(null);
    this.emitir(rangoDeAtajo(atajo, hoyEnPlanta()));
  }

  /** Called when the end date of the range field changes (both ends are then set). */
  protected rangoPersonalizadoCambiado(): void {
    const { inicio, fin } = this.rangoForm.getRawValue();
    if (!inicio || !fin) {
      return;
    }
    const nuevo = { desde: dateAIso(inicio), hasta: dateAIso(fin) };
    if (nuevo.desde < FECHA_MIN.slice(0, 10)) {
      this.errorRango.set('La fecha desde no puede ser anterior al 01/01/2000.');
      return;
    }
    if (diasEnRango(nuevo.desde, nuevo.hasta) > RESUMEN_MAX_DIAS) {
      this.errorRango.set(`El período no puede superar los ${RESUMEN_MAX_DIAS} días.`);
      return;
    }
    this.errorRango.set(null);
    this.emitir(nuevo);
  }

  protected proveedorCambiado(): void {
    const id = this.proveedorControl.value;
    this.emitir({ proveedorId: id === this.TODOS ? null : id });
  }

  protected soloCambiado(): void {
    this.emitir({ soloFueraDeRango: this.soloControl.value });
  }

  private emitir(cambios: Partial<FiltroRecepciones>): void {
    this.cambio.emit({ ...this.filtros(), ...cambios, pagina: undefined });
  }
}
