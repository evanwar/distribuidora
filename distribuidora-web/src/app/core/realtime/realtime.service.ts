import { Injectable, inject, signal } from '@angular/core';
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';
import { defer, filter, map, merge, Observable, of, Subject } from 'rxjs';
import { SessionService } from '../auth/session.service';

export type RealtimeChannel =
  | 'sales'
  | 'inventory'
  | 'purchases'
  | 'receivables'
  | 'catalogs'
  | 'payment-terminals'
  | 'invoicing'
  | 'security'
  | 'logs';

export interface RealtimeEvent {
  eventId: string;
  channel: RealtimeChannel;
  eventName: string;
  entityName: string;
  entityId: string;
  occurredAt: string;
  correlationId: string;
  operationId: string;
}

// null means that the consumer must reconcile its state through the HTTP API.
export type RealtimeChange = RealtimeEvent | null;

@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private readonly session = inject(SessionService);
  private readonly events = new Subject<RealtimeEvent>();
  private readonly reconciliationRequests = new Subject<RealtimeChannel>();
  private readonly desiredChannels = new Set<RealtimeChannel>();
  private readonly deliveredEventIds = new Set<string>();
  private readonly deliveredEventOrder: string[] = [];
  private readonly connection: HubConnection;
  private startInFlight?: Promise<void>;
  private retryHandle?: ReturnType<typeof setTimeout>;

  private readonly connectedState = signal(false);
  readonly connected = this.connectedState.asReadonly();

  constructor() {
    this.connection = new HubConnectionBuilder()
      .withUrl('/hubs/realtime', {
        accessTokenFactory: () => this.session.accessToken() ?? '',
      })
      .withAutomaticReconnect([0, 2_000, 5_000, 10_000, 30_000])
      .withStatefulReconnect({ bufferSize: 100_000 })
      .configureLogging(LogLevel.Warning)
      .build();

    this.connection.on('domainEvent', (event: RealtimeEvent) => this.accept(event));
    this.connection.onreconnecting(() => this.connectedState.set(false));
    this.connection.onreconnected(() => void this.restoreSubscriptions());
    this.connection.onclose(() => {
      this.connectedState.set(false);
      this.scheduleStart();
    });
  }

  watch(channel: RealtimeChannel): Observable<RealtimeChange> {
    return defer(() => {
      this.desiredChannels.add(channel);
      void this.ensureConnected();
      return merge(
        of<RealtimeChange>(null),
        this.events.pipe(filter((event) => event.channel === channel)),
        this.reconciliationRequests.pipe(
          filter((requestedChannel) => requestedChannel === channel),
          map(() => null),
        ),
      );
    });
  }

  private async ensureConnected(): Promise<void> {
    if (!this.session.accessToken()) return;
    if (this.connection.state === HubConnectionState.Connected) {
      await this.subscribeDesiredChannels();
      return;
    }
    if (this.startInFlight) return this.startInFlight;

    this.startInFlight = this.connection
      .start()
      .then(() => this.restoreSubscriptions())
      .catch(() => this.scheduleStart())
      .finally(() => {
        this.startInFlight = undefined;
      });
    return this.startInFlight;
  }

  private async restoreSubscriptions(): Promise<void> {
    this.connectedState.set(true);
    await this.subscribeDesiredChannels();
    for (const channel of this.desiredChannels) this.reconciliationRequests.next(channel);
  }

  private async subscribeDesiredChannels(): Promise<void> {
    if (this.connection.state !== HubConnectionState.Connected) return;
    await Promise.all(
      [...this.desiredChannels].map((channel) => this.connection.invoke('Subscribe', channel)),
    );
  }

  private scheduleStart(): void {
    if (this.retryHandle || !this.session.accessToken()) return;
    this.retryHandle = setTimeout(() => {
      this.retryHandle = undefined;
      void this.ensureConnected();
    }, 5_000);
  }

  private accept(event: RealtimeEvent): void {
    if (!event?.eventId || this.deliveredEventIds.has(event.eventId)) return;
    this.deliveredEventIds.add(event.eventId);
    this.deliveredEventOrder.push(event.eventId);
    if (this.deliveredEventOrder.length > 1_000) {
      const oldest = this.deliveredEventOrder.shift();
      if (oldest) this.deliveredEventIds.delete(oldest);
    }
    this.events.next(event);
  }
}
