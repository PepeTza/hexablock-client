/**
 * Common contract for every application use case, so AOP decorators
 * (`LoggingUseCaseDecorator`, retries, security; ADR-06) wrap both
 * synchronous and asynchronous use cases uniformly.
 */
export interface IUseCase<TInput, TOutput> {
  execute(input: TInput): TOutput;
}
