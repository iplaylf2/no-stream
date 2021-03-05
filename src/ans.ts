import {
  conj,
  count,
  every,
  filter,
  first,
  flatten,
  foreach,
  groupBy,
  include,
  last,
  map,
  partition,
  partitionBy,
  reduce,
  remove,
  scan,
  skip,
  skipWhile,
  some,
  take,
  takeWhile,
  toArray,
  AsyncTransduceFunction,
  AsyncTransduceHandler,
} from "each-once/async";
import { Subscriber, Unsubscribable } from "./observable/observable";
import { Signal } from "./tool/block";

interface Map<T, K> {
  (x: T): K | Promise<K>;
}

interface Scan<T, K> {
  (r: K, x: T): K | Promise<K>;
}

interface Predicate<T> {
  (x: T): boolean | Promise<boolean>;
}

interface Group<T, K> {
  (x: T): K | Promise<K>;
}

interface GroupByReduce<T, Key, K> {
  (k: Key): AsyncTransduceHandler<T, K>;
}

interface ReduceFunction<T, K> {
  (r: K, x: T): K | Promise<K>;
}

interface Action<T> {
  (x: T): void | Promise<void>;
}

type Zip<T extends ANS<any>[]> = T extends [infer A, ...infer Rest]
  ? A extends ANS<infer Item>
    ? Rest extends ANS<any>[]
      ? Rest[0] extends ANS<any>
        ? [Item, ...Zip<Rest>]
        : [Item]
      : never
    : never
  : never;

export class ANS<T> {
  static create<T>(
    iter:
      | { [Symbol.iterator](): IterableIterator<T> }
      | (() => AsyncIterableIterator<T>)
  ): ANS<T> {
    const source =
      iter instanceof Function
        ? iter
        : async function* () {
            yield* iter;
          };
    return new ANS((x) => [x], source);
  }

  static observable<T>(
    subscribe: (subscriber: Subscriber<T>) => void | Unsubscribable
  ): ANS<T> {
    return new ANS<T>(
      (next) => [
        next,
        async (continue_) => {
          if (!continue_) {
            return false;
          }

          let unsubscribable!: void | Unsubscribable;
          return new Promise<boolean>((resolve, reject) => {
            let open = true;

            let p = Promise.resolve();

            try {
              unsubscribable = subscribe({
                next(x) {
                  p = p.then(
                    () =>
                      open &&
                      next(x).then(
                        (continue_) =>
                          continue_ ||
                          (((open = false), resolve(false)) as any),
                        (e) => ((open = false), reject(e))
                      )
                  );
                },
                complete() {
                  p.then(() => ((open = false), resolve(true)));
                },
                error(e) {
                  p.then(() => ((open = false), reject(e)));
                },
              });
            } catch (e) {
              p.then(() => ((open = false), reject(e)));
            }
          }).finally(unsubscribable as Unsubscribable);
        },
      ],
      async function* () {}
    );
  }

  static concat<T>(ans: ANS<T>, ...anss: ANS<T>[]): ANS<T> {
    return ans.concat(...anss);
  }

  static zip<T extends ANS<any>[]>(...anss: [...T]): ANS<Zip<T>> {
    if (anss.length === 0) {
      throw "anss.length === 0";
    }

    return new ANS(
      (next) => [
        next,
        async (continue_) => {
          if (!continue_) {
            return false;
          }

          return new Promise((resolve, reject) => {
            const limit = anss.length;
            let count = 0;
            let result: any[] = [];
            let open = true;

            const every_signal = new Signal();
            every_signal.block();

            let p = Promise.resolve();

            anss.every((ans, i) => {
              if (!open) {
                return false;
              }

              (async () => {
                try {
                  await ans.every(async (x) => {
                    result[i] = x;
                    count++;

                    if (count === limit) {
                      p = next(result as any)
                        .then(
                          (continue_) =>
                            continue_ || ((open = false), resolve(false)),
                          (e) => ((open = false), reject(e))
                        )
                        .finally(
                          () => (every_signal.unblock(), every_signal.block())
                        ) as Promise<void>;
                      count = 0;
                      result = [];
                    }

                    await every_signal.wait;
                    return open;
                  });
                  await p.then(() => ((open = false), resolve(true)));
                } catch (e) {
                  await p.then(() => ((open = false), reject(e)));
                } finally {
                  every_signal.unblock();
                }
              })();

              return open;
            });
          });
        },
      ],
      async function* () {}
    );
  }

  static race<T>(...anss: ANS<T>[]): ANS<T> {
    if (anss.length === 0) {
      throw "anss.length === 0";
    }

    return new ANS(
      (next) => [
        next,
        async (continue_) => {
          if (!continue_) {
            return false;
          }

          return new Promise((resolve, reject) => {
            const limit = anss.length;
            let count = 0;
            let buoy = 0;
            let open = true;

            let p = Promise.resolve();

            anss.every((ans) => {
              if (!open) {
                return false;
              }

              (async () => {
                try {
                  await ans.every(async (x) => {
                    buoy++;
                    p = p.then(
                      () =>
                        open &&
                        next(x).then(
                          (c) => c || ((open = false), resolve(false)),
                          (e) => ((open = false), reject(e)) as any
                        )
                    ) as Promise<void>;
                    await p;
                    buoy--;

                    if (open) {
                      while (buoy !== 0) {
                        await p;
                      }
                    }

                    return open;
                  });

                  count++;
                  if (count === limit) {
                    p.then(() => resolve(true));
                  }
                } catch (e) {
                  p.then(() => ((open = false), reject(e)));
                }
              })();

              return open;
            });
          });
        },
      ],
      async function* () {}
    );
  }

  constructor(
    tf: AsyncTransduceFunction<any, T>,
    iter: () => AsyncIterableIterator<any>
  ) {
    this.tf = tf;
    this.iter = iter;
  }

  // transform

  map<K>(f: Map<T, K>): ANS<K> {
    return new ANS(conj(this.tf, map(f)), this.iter);
  }

  scan<K>(f: Scan<T, K>, v: K): ANS<K> {
    return new ANS(conj(this.tf, scan(f, v)), this.iter);
  }

  filter(f: Predicate<T>): ANS<T> {
    return new ANS(conj(this.tf, filter(f)), this.iter);
  }

  remove(f: Predicate<T>): ANS<T> {
    return new ANS(conj(this.tf, remove(f)), this.iter);
  }

  take(n: number): ANS<T> {
    return new ANS(conj(this.tf, take(n)), this.iter);
  }

  takeWhile(f: Predicate<T>): ANS<T> {
    return new ANS(conj(this.tf, takeWhile(f)), this.iter);
  }

  skip(n: number): ANS<T> {
    return new ANS(conj(this.tf, skip(n)), this.iter);
  }

  skipWhile(f: Predicate<T>): ANS<T> {
    return new ANS(conj(this.tf, skipWhile(f)), this.iter);
  }

  partition(n: number): ANS<T[]> {
    return new ANS(conj(this.tf, partition(n)), this.iter);
  }

  partitionBy(f: Map<T, any>): ANS<T[]> {
    return new ANS(conj(this.tf, partitionBy(f)), this.iter);
  }

  flatten(): T extends Array<infer K> ? ANS<K> : never {
    return new ANS(conj(this.tf, flatten() as any), this.iter) as any;
  }

  groupBy<Key, K>(f: Group<T, Key>, gr: GroupByReduce<T, Key, K>): ANS<K> {
    return new ANS(conj(this.tf, groupBy(f, gr)), this.iter);
  }

  cache(): ANS<T> {
    const ns = this;
    let cache: T[];
    return ANS.create(async function* () {
      if (!cache) {
        cache = await ns.toArray();
      }
      yield* cache;
    });
  }

  // reduce

  count(): Promise<number> {
    return count(this.tf)(this.iter());
  }

  include(v: T): Promise<boolean> {
    return include(v, this.tf)(this.iter());
  }

  every(f: Predicate<T>): Promise<boolean> {
    return every(f, this.tf)(this.iter());
  }

  some(f: Predicate<T>): Promise<boolean> {
    return some(f, this.tf)(this.iter());
  }

  first(): Promise<T | void> {
    return first(this.tf)(this.iter());
  }

  last(): Promise<T | void> {
    return last(this.tf)(this.iter());
  }

  reduce<K>(rf: ReduceFunction<T, K>, v: K): Promise<K> {
    return reduce(rf, v, this.tf)(this.iter());
  }

  foreach(f: Action<T>): Promise<void> {
    return foreach(f, this.tf)(this.iter());
  }

  toArray(): Promise<T[]> {
    return toArray(this.tf)(this.iter());
  }

  // sp

  concat(...anss: ANS<T>[]): ANS<T> {
    return new ANS(
      conj(this.tf, (next) => [
        next,
        async (continue_) => {
          if (!continue_) {
            return false;
          }

          for (const ans of anss) {
            const continue_ = await ans.every(next);
            if (!continue_) {
              return false;
            }
          }
          return true;
        },
      ]),
      this.iter
    );
  }

  private tf: AsyncTransduceFunction<any, T>;
  private iter: () => AsyncIterableIterator<any>;
}
