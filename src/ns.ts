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
} from "each-once";
import {
  TransduceFunction,
  TransduceHandler,
} from "each-once/transduce/sync/type";

interface Map<T, K> {
  (x: T): K;
}

interface Scan<T, K> {
  (r: K, x: T): K;
}

interface Predicate<T> {
  (x: T): boolean;
}

interface Group<T, K> {
  (x: T): K;
}

interface GroupByReduce<T, Key, K> {
  (k: Key): TransduceHandler<T, K>;
}

interface ReduceFunction<T, K> {
  (r: K, x: T): K;
}

interface Action<T> {
  (x: T): any;
}

type Zip<T extends NS<any>[]> = T extends [infer A, ...infer Rest]
  ? A extends NS<infer Item>
    ? Rest extends NS<any>[]
      ? Rest[0] extends NS<any>
        ? [Item, ...Zip<Rest>]
        : [Item]
      : never
    : never
  : never;

export class NS<T> {
  static create<T>(
    iter:
      | { [Symbol.iterator](): IterableIterator<T> }
      | (() => IterableIterator<T>)
  ): NS<T> {
    const source =
      iter instanceof Function ? iter : () => iter[Symbol.iterator]();
    return new NS((x) => [x], source);
  }

  static concat<T>(...nss: NS<T>[]): NS<T> {
    return nss as any;
  }

  static zip<T extends NS<any>[]>(...nss: [...T]): NS<Zip<T>> {
    return nss as any;
  }

  constructor(
    tf: TransduceFunction<any, T>,
    iter: () => IterableIterator<any>
  ) {
    this.tf = tf;
    this.iter = iter;
  }

  // transform

  map<K>(f: Map<T, K>): NS<K> {
    return new NS(conj(this.tf, map(f)), this.iter);
  }

  scan<K>(f: Scan<T, K>, v: K): NS<K> {
    return new NS(conj(this.tf, scan(f, v)), this.iter);
  }

  filter(f: Predicate<T>): NS<T> {
    return new NS(conj(this.tf, filter(f)), this.iter);
  }

  remove(f: Predicate<T>): NS<T> {
    return new NS(conj(this.tf, remove(f)), this.iter);
  }

  take(n: number): NS<T> {
    return new NS(conj(this.tf, take(n)), this.iter);
  }

  takeWhile(f: Predicate<T>): NS<T> {
    return new NS(conj(this.tf, takeWhile(f)), this.iter);
  }

  skip(n: number): NS<T> {
    return new NS(conj(this.tf, skip(n)), this.iter);
  }

  skipWhile(f: Predicate<T>): NS<T> {
    return new NS(conj(this.tf, skipWhile(f)), this.iter);
  }

  partition(n: number): NS<T[]> {
    return new NS(conj(this.tf, partition(n)), this.iter);
  }

  partitionBy(f: Map<T, any>): NS<T[]> {
    return new NS(conj(this.tf, partitionBy(f)), this.iter);
  }

  flatten(): T extends Array<infer K> ? NS<K> : never {
    return new NS(conj(this.tf, flatten() as any), this.iter) as any;
  }

  groupBy<Key, K>(f: Group<T, Key>, gr: GroupByReduce<T, Key, K>): NS<K> {
    return new NS(conj(this.tf, groupBy(f, gr)), this.iter);
  }

  cache(): NS<T> {
    const cache = this.toArray();
    return new NS(
      (x) => [x],
      () => cache[Symbol.iterator]()
    );
  }

  // reduce

  count(): number {
    return count(this.tf)(this.iter());
  }

  include(v: T): boolean {
    return include(v, this.tf)(this.iter());
  }

  every(f: Predicate<T>): boolean {
    return every(f, this.tf)(this.iter());
  }

  some(f: Predicate<T>): boolean {
    return some(f, this.tf)(this.iter());
  }

  first(): T | void {
    return first(this.tf)(this.iter());
  }

  last(): T | void {
    return last(this.tf)(this.iter());
  }

  reduce<K>(rf: ReduceFunction<T, K>, v: K): K {
    return reduce(rf, v, this.tf)(this.iter());
  }

  foreach(f: Action<T>): void {
    return foreach(f, this.tf)(this.iter());
  }

  toArray(): T[] {
    return toArray(this.tf)(this.iter());
  }

  private tf: TransduceFunction<any, T>;
  private iter: () => IterableIterator<any>;
}
