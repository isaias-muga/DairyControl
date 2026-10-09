import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RecepcionForm } from './recepcion-form';

describe('RecepcionForm', () => {
  let component: RecepcionForm;
  let fixture: ComponentFixture<RecepcionForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecepcionForm],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(RecepcionForm);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('proveedorId', 'test-id');
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
