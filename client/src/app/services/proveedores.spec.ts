import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProveedoresService } from './proveedores';

describe('Proveedores', () => {
  let service: ProveedoresService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ProveedoresService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getById asks for one proveedor and gets its name and count', () => {
    let resultado: unknown;

    service.getById('abc').subscribe((p) => (resultado = p));
    http.expectOne((r) => r.url.endsWith('/Proveedores/abc')).flush({ id: 'abc', nombre: 'Tambo', cantidadRecepciones: 4 });

    expect(resultado).toEqual({ id: 'abc', nombre: 'Tambo', cantidadRecepciones: 4 });
  });
});
