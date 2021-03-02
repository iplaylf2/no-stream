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
} from "each-once/async";
import {
  AsyncTransduceFunction,
  AsyncTransduceHandler,
} from "each-once/transduce/async/type";
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
  (x: T): any;
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

  static concat<T>(ans: ANS<T>, ...anss: ANS<T>[]): ANS<T> {
    return ans.concat(...anss);
  }

  static zip<T extends ANS<any>[]>(...anss: [...T]): ANS<Zip<T>> {
    if (anss.length === 0) {
      throw "anss.length === 0";
    }

    return ANS.create(async function* () {
      let result: any[] = [];
      let continue_ = true;
      let throw_ = false;
      let error: any;

      const limit = anss.length;
      let count = 0;

      const each_signal = new Signal();
      each_signal.block();

      const yield_signal = new Signal();
      yield_signal.block();

      anss.forEach(async (ans, i) => {
        try {
          await ans.foreach(async (x) => {
            result[i] = x;
            count++;

            if (count === limit) {
              yield_signal.unblock();
            }

            await each_signal.wait;
          });
        } catch (e) {
          throw_ = true;
          error = e;
        } finally {
          continue_ = false;
          yield_signal.unblock();
        }
      });

      while (true) {
        await yield_signal.wait;

        if (continue_) {
          const r = result;
          result = [];

          yield r;

          count = 0;
          yield_signal.block();
          each_signal.unblock();
          each_signal.block();
        } else if (throw_) {
          throw error;
        } else {
          return;
        }
      }
    }) as any;
  }

  static race<T>(...anss: ANS<T>[]): ANS<T> {
    return ANS.create(async function* () {
      yield anss;
    }) as any;
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
    const cache = this.toArray();
    return ANS.create(async function* () {
      yield* await cache;
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
        async () => {
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
