import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { slowRequestInterceptor, SLOW_REQUEST_MS } from './slow-request-interceptor';
import { ServerStatusService } from '../services/server-status';

describe('slowRequestInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let serverStatus: ServerStatusService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([slowRequestInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    serverStatus = TestBed.inject(ServerStatusService);
  });

  afterEach(() => {
    httpTesting.verify();
    vi.useRealTimers();
  });

  it('shows the waking-up state only after a request is slow', () => {
    http.get('/api/Proveedores').subscribe();
    const req = httpTesting.expectOne('/api/Proveedores');

    vi.advanceTimersByTime(SLOW_REQUEST_MS - 1);
    expect(serverStatus.isWakingUp()).toBe(false);

    vi.advanceTimersByTime(1);
    expect(serverStatus.isWakingUp()).toBe(true);

    req.flush([]);
    expect(serverStatus.isWakingUp()).toBe(false);
  });

  it('never shows it for a fast request', () => {
    http.get('/api/Proveedores').subscribe();
    httpTesting.expectOne('/api/Proveedores').flush([]);

    vi.advanceTimersByTime(SLOW_REQUEST_MS);
    expect(serverStatus.isWakingUp()).toBe(false);
  });
});
