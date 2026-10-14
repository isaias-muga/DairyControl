import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ServerStatusService {
  private slowRequests = signal(0);

  readonly isWakingUp = computed(() => this.slowRequests() > 0);

  slowRequestStarted(): void {
    this.slowRequests.update((count) => count + 1);
  }

  slowRequestFinished(): void {
    this.slowRequests.update((count) => count - 1);
  }
}
