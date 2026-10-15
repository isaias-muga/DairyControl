import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MatTooltip } from '@angular/material/tooltip';
import { ObservacionCelda } from './observacion-celda';

describe('ObservacionCelda', () => {
  let fixture: ComponentFixture<ObservacionCelda>;

  const larga = 'Entrega con demora por lluvia; el camión llegó tarde y el silo estaba ocupado.';

  async function setup(texto: string | null): Promise<void> {
    await TestBed.configureTestingModule({ imports: [ObservacionCelda] }).compileComponents();
    fixture = TestBed.createComponent(ObservacionCelda);
    fixture.componentRef.setInput('texto', texto);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  const boton = (): HTMLButtonElement | null => fixture.nativeElement.querySelector('button');
  const mas = (): HTMLElement | null => fixture.nativeElement.querySelector('.mas');

  // jsdom has no layout: simulate a text that is wider than its box
  function simularTextoCortado(cortado: boolean): void {
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.classList.contains('texto') ? (cortado ? 300 : 100) : 0;
    });
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.classList.contains('texto') ? 100 : 0;
    });
  }

  afterEach(() => vi.restoreAllMocks());

  it('renders nothing when there is no observation', async () => {
    await setup(null);

    expect(boton()).toBeNull();
  });

  it('renders nothing for an empty observation', async () => {
    await setup('');

    expect(boton()).toBeNull();
  });

  it('renders a real button with the text', async () => {
    await setup(larga);

    expect(boton()).toBeTruthy();
    expect(boton()!.type).toBe('button');
    expect(boton()!.textContent).toContain(larga);
  });

  it('keeps the full text as the hover tooltip', async () => {
    await setup(larga);

    const tooltip = fixture.debugElement.query(By.directive(MatTooltip)).injector.get(MatTooltip);

    expect(tooltip.message).toBe(larga);
  });

  it('emits abrir when the button is clicked', async () => {
    await setup(larga);
    const abrir = vi.fn();
    fixture.componentInstance.abrir.subscribe(abrir);

    boton()!.click();

    expect(abrir).toHaveBeenCalledTimes(1);
  });

  it('shows the "ver más" affordance only when the text is truncated', async () => {
    simularTextoCortado(true);
    await setup(larga);

    expect(mas()).toBeTruthy();
    expect(mas()!.textContent).toContain('ver más');
    expect(boton()!.classList).toContain('truncada');
  });

  it('does not show "ver más" when the text fits', async () => {
    simularTextoCortado(false);
    await setup('Acidez alta');

    expect(mas()).toBeNull();
    expect(boton()!.classList).not.toContain('truncada');
  });
});
