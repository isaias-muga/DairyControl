import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProveedorDetail } from './proveedor-detail';

describe('ProveedorDetail', () => {
  let component: ProveedorDetail;
  let fixture: ComponentFixture<ProveedorDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProveedorDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(ProveedorDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
