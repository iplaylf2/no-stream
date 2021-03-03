export interface Subscriber<T> {
  next(x: T): void;
  complete(): void;
  error(e: any): void;
}

export interface Unsubscribable {
  (): void;
}
