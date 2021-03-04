import {
  conj,
  filter,
  flatten,
  groupBy,
  map,
  partition,
  partitionBy,
  remove,
  scan,
  skip,
  skipWhile,
  take,
  takeWhile,
  TransduceFunction,
  TransduceHandler,
} from "each-once";
import {
  count,
  every,
  first,
  foreach,
  include,
  last,
  reduce,
  some,
  toArray,
} from "each-once/transduce";

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
  (x: T): void;
}

export class NSR<TSource, TResult> {
  static create<T>(): NSR<T, T> {
    return new NSR((next) => [next]);
  }

  constructor(tf: TransduceFunction<TSource, TResult>) {
    this.tf = tf;
  }

  map<K>(f: Map<TResult, K>): NSR<TSource, K> {
    return new NSR(conj(this.tf, map(f)));
  }

  scan<K>(f: Scan<TResult, K>, v: K): NSR<TSource, K> {
    return new NSR(conj(this.tf, scan(f, v)));
  }

  filter(f: Predicate<TResult>): NSR<TSource, TResult> {
    return new NSR(conj(this.tf, filter(f)));
  }

  remove(f: Predicate<TResult>): NSR<TSource, TResult> {
    return new NSR(conj(this.tf, remove(f)));
  }

  take(n: number): NSR<TSource, TResult> {
    return new NSR(conj(this.tf, take(n)));
  }

  takeWhile(f: Predicate<TResult>): NSR<TSource, TResult> {
    return new NSR(conj(this.tf, takeWhile(f)));
  }

  skip(n: number): NSR<TSource, TResult> {
    return new NSR(conj(this.tf, skip(n)));
  }

  skipWhile(f: Predicate<TResult>): NSR<TSource, TResult> {
    return new NSR(conj(this.tf, skipWhile(f)));
  }

  partition(n: number): NSR<TSource, TResult[]> {
    return new NSR(conj(this.tf, partition(n)));
  }

  partitionBy(f: Map<TResult, any>): NSR<TSource, TResult[]> {
    return new NSR(conj(this.tf, partitionBy(f)));
  }

  flatten(): TResult extends Array<infer K> ? NSR<TSource, K> : never {
    return new NSR(conj(this.tf, flatten() as any)) as any;
  }

  groupBy<Key, K>(
    f: Group<TResult, Key>,
    gr: GroupByReduce<TResult, Key, K>
  ): NSR<TSource, K> {
    return new NSR(conj(this.tf, groupBy(f, gr)));
  }

  // reduce

  count(): TransduceHandler<TSource, number> {
    return count(this.tf);
  }

  include(v: TResult): TransduceHandler<TSource, boolean> {
    return include(v as any, this.tf);
  }

  every(f: Predicate<TResult>): TransduceHandler<TSource, boolean> {
    return every(f as any, this.tf);
  }

  some(f: Predicate<TResult>): TransduceHandler<TSource, boolean> {
    return some(f as any, this.tf);
  }

  first(): TransduceHandler<TSource, TResult | void> {
    return first(this.tf);
  }

  last(): TransduceHandler<TSource, TResult | void> {
    return last(this.tf);
  }

  reduce<K>(
    rf: ReduceFunction<TResult, K>,
    v: K
  ): TransduceHandler<TSource, K> {
    return reduce(rf as any, v, this.tf);
  }

  foreach(f: Action<TResult>): TransduceHandler<TSource, void> {
    return foreach(f as any, this.tf);
  }

  toArray(): TransduceHandler<TSource, TResult[]> {
    return toArray(this.tf);
  }

  private tf: TransduceFunction<TSource, TResult>;
}
