import type { DomainEvent } from '@domain/engine/events/domain-event';

/**
 * Port (DIP, Observer): publishes application-level domain events (such as
 * `GameOver` or `LevelCompleted` in CU-07) so UI and audio react without
 * coupling use cases to frameworks.
 */
export interface IEventBus {
  publish(event: DomainEvent): void;
}
