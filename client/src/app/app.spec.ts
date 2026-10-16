import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    })
      .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('shows the three section tabs when logged in', async () => {
    localStorage.setItem('dairycontrol_token', 'x');
    try {
      const fixture = TestBed.createComponent(App);
      await fixture.whenStable();

      const enlaces = Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll('nav a'),
      ).map((a) => a.textContent?.trim());

      expect(enlaces).toEqual(['Resumen', 'Recepciones', 'Proveedores']);
    } finally {
      localStorage.removeItem('dairycontrol_token');
    }
  });

  it('shows Configuración as a gear button outside the tabs when logged in', async () => {
    localStorage.setItem('dairycontrol_token', 'x');
    try {
      const fixture = TestBed.createComponent(App);
      await fixture.whenStable();

      const engranaje = (fixture.nativeElement as HTMLElement).querySelector('a[aria-label="Configuración"]');

      expect(engranaje).not.toBeNull();
      expect(engranaje?.getAttribute('href')).toBe('/configuracion');
      expect(engranaje?.closest('nav')).toBeNull();
    } finally {
      localStorage.removeItem('dairycontrol_token');
    }
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('mat-toolbar')?.textContent).toContain('DairyControl');
  });
});
