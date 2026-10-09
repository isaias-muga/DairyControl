import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ProveedorDetail } from './proveedor-detail';

describe('ProveedorDetail', () => {
  let component: ProveedorDetail;
  let fixture: ComponentFixture<ProveedorDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProveedorDetail],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ProveedorDetail);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('id', 'test-id');
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
