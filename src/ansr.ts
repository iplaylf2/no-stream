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
  AsyncTransduceFunction,
  AsyncTransduceHandler,
} from "each-once/async";
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
} from "each-once/async/transduce";

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

export class ANSR<TSource, TResult> {
  static create<T>(): ANSR<T, T> {
    return new ANSR((next) => [next]);
  }

  constructor(tf: AsyncTransduceFunction<TSource, TResult>) {
    this.tf = tf;
  }

  map<K>(f: Map<TResult, K>): ANSR<TSource, K> {
    return new ANSR(conj(this.tf, map(f)));
  }

  scan<K>(f: Scan<TResult, K>, v: K): ANSR<TSource, K> {
    return new ANSR(conj(this.tf, scan(f, v)));
  }

  filter(f: Predicate<TResult>): ANSR<TSource, TResult> {
    return new ANSR(conj(this.tf, filter(f)));
  }

  remove(f: Predicate<TResult>): ANSR<TSource, TResult> {
    return new ANSR(conj(this.tf, remove(f)));
  }

  take(n: number): ANSR<TSource, TResult> {
    return new ANSR(conj(this.tf, take(n)));
  }

  takeWhile(f: Predicate<TResult>): ANSR<TSource, TResult> {
    return new ANSR(conj(this.tf, takeWhile(f)));
  }

  skip(n: number): ANSR<TSource, TResult> {
    return new ANSR(conj(this.tf, skip(n)));
  }

  skipWhile(f: Predicate<TResult>): ANSR<TSource, TResult> {
    return new ANSR(conj(this.tf, skipWhile(f)));
  }

  partition(n: number): ANSR<TSource, TResult[]> {
    return new ANSR(conj(this.tf, partition(n)));
  }

  partitionBy(f: Map<TResult, any>): ANSR<TSource, TResult[]> {
    return new ANSR(conj(this.tf, partitionBy(f)));
  }

  flatten(): TResult extends Array<infer K> ? ANSR<TSource, K> : never {
    return new ANSR(conj(this.tf, flatten() as any)) as any;
  }

  groupBy<Key, K>(
    f: Group<TResult, Key>,
    gr: GroupByReduce<TResult, Key, K>
  ): ANSR<TSource, K> {
    return new ANSR(conj(this.tf, groupBy(f, gr)));
  }

  // reduce

  count(): AsyncTransduceHandler<TSource, number> {
    return count(this.tf);
  }

  include(v: TResult): AsyncTransduceHandler<TSource, boolean> {
    return include(v as any, this.tf);
  }

  every(f: Predicate<TResult>): AsyncTransduceHandler<TSource, boolean> {
    return every(f as any, this.tf);
  }

  some(f: Predicate<TResult>): AsyncTransduceHandler<TSource, boolean> {
    return some(f as any, this.tf);
  }

  first(): AsyncTransduceHandler<TSource, TResult | void> {
    return first(this.tf);
  }

  last(): AsyncTransduceHandler<TSource, TResult | void> {
    return last(this.tf);
  }

  reduce<K>(
    rf: ReduceFunction<TResult, K>,
    v: K
  ): AsyncTransduceHandler<TSource, K> {
    return reduce(rf as any, v, this.tf);
  }

  foreach(f: Action<TResult>): AsyncTransduceHandler<TSource, void> {
    return foreach(f as any, this.tf);
  }

  toArray(): AsyncTransduceHandler<TSource, TResult[]> {
    return toArray(this.tf);
  }

  private tf: AsyncTransduceFunction<TSource, TResult>;
}
