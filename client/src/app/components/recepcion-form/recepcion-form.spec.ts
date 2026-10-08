import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecepcionForm } from './recepcion-form';

describe('RecepcionForm', () => {
  let component: RecepcionForm;
  let fixture: ComponentFixture<RecepcionForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecepcionForm],
    }).compileComponents();

    fixture = TestBed.createComponent(RecepcionForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
