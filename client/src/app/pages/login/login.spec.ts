import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Login } from './login';
import { AuthService } from '../../services/auth';
import { DEMO_CREDENTIALS, DemoCredentials } from '../../demo-credentials';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;

  const demoCredentials: DemoCredentials = { username: 'admin', password: 'secret-demo' };

  async function setup(credentials: DemoCredentials | null): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: DEMO_CREDENTIALS, useValue: credentials },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    await fixture.whenStable();
  }

  function findButton(text: string): HTMLButtonElement | undefined {
    const buttons: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    );
    return buttons.find((b) => b.textContent?.includes(text));
  }

  it('should create', async () => {
    await setup(demoCredentials);

    expect(component).toBeTruthy();
  });

  it('useDemoCredentialsButton_Click_FillsFormWithoutSubmitting', async () => {
    // Arrange
    await setup(demoCredentials);
    const loginSpy = vi.spyOn(TestBed.inject(AuthService), 'login');
    const button = findButton('Usar credenciales de demo');
    expect(button).toBeTruthy();

    // Act
    button!.click();
    await fixture.whenStable();

    // Assert
    expect(button!.type).toBe('button');
    expect(component.form.getRawValue()).toEqual({
      username: 'admin',
      password: 'secret-demo',
    });
    expect(loginSpy).not.toHaveBeenCalled();
  });

  it('credentialsBlock_NullToken_IsNotRendered', async () => {
    // Arrange / Act
    await setup(null);

    // Assert
    expect(fixture.nativeElement.querySelector('.demo-credentials')).toBeNull();
    expect(findButton('Usar credenciales de demo')).toBeUndefined();
    expect(fixture.nativeElement.textContent).not.toContain('Contraseña: ');
  });
});
