# document

- [ns](#ns)
- [ns.concat](#nsconcat)
- [NS](#ns-1)
  - [transform method](#transform-method)
    - [map](#map)
    - [scan](#scan)
    - [filter](#filter)
    - [remove](#remove)
    - [take](#take)
    - [takeWhile](#takewhile)
    - [skip](#skip)
    - [skipWhile](#skipwhile)
    - [partition](#partition)
    - [partitionBy](#partitionby)
    - [flatten](#flatten)
    - [groupBy](#groupby)
      - [GroupByReduce](#groupbyreduce)
      - [usage](#usage)
  - [reduce method](#reduce-method)
    - [count](#count)
    - [include](#include)
    - [every](#every)
    - [some](#some)
    - [first](#first)
    - [last](#last)
    - [reduce](#reduce)
    - [foreach](#foreach)
    - [toArray](#toarray)
  - [merge method](#merge-method)
    - [concat](#concat)
- [ans](#ans)
- [ans.ob](#ansob)
- [ans.concat](#ansconcat)
- [ans.zip](#anszip)
- [ans.race](#ansrace)
- [ANS](#ans-1)

## ns

no-stream alias ns, used to create a stream.

``` typescript
function ns<T>(iter: {
    [Symbol.iterator](): IterableIterator<T>;
} | (() => IterableIterator<T>)): NS<T>
```

## ns.concat

Stream\<T>[] => Stream\<T>

``` typescript
concat<T>(ns: NS<T>, ...nss: NS<T>[]): NS<T>
```

## NS

NoStream alias NS.

### transform method

Stream\<A> => Stream\<B>

#### map

``` typescript
NS<T>.map<K>(f: Map<T, K>): NS<K>
```

#### scan

``` typescript
NS<T>.scan<K>(f: Scan<T, K>, v: K): NS<K>
```

#### filter

``` typescript
NS<T>.filter(f: Predicate<T>): NS<T>
```

#### remove

``` typescript
NS<T>.remove(f: Predicate<T>): NS<T>
```

#### take

``` typescript
NS<T>.take(n: number): NS<T>
```

#### takeWhile

``` typescript
NS<T>.takeWhile(f: Predicate<T>): NS<T>
```

#### skip

``` typescript
NS<T>.skip(n: number): NS<T>
```

#### skipWhile

``` typescript
NS<T>.skipWhile(f: Predicate<T>): NS<T>
```

#### partition

``` typescript
NS<T>.partition(n: number): NS<T[]>
```

#### partitionBy

``` typescript
NS<T>.partitionBy(f: Map<T, any>): NS<T[]>
```

#### flatten

``` typescript
NS<T>.flatten(): T extends (infer K)[] ? NS<K> : never
```

#### groupBy

``` typescript
NS<T>.groupBy<Key, K>(f: Group<T, Key>, gr: GroupByReduce<T, Key, K>): NS<K>
```

##### GroupByReduce

``` typescript
function groupByReduce<T, Key, K>(k: Key): TransduceHandler<T, K>
```

Get transduce handler by nsr, which is an alias for NoStreamReduce.

``` typescript
import { nsr } from "no-stream";
```

##### usage

``` typescript
import { ns, nsr } from "no-stream";

const s = ns(function* () {
  while (true) {
    yield Math.random() * 10;
  }
});

s.take(100)
  .groupBy(
    (x) => Math.floor(x),
    (key) => nsr<number>().take(10).toArray()
  )
  .foreach((x) => console.log(x));

```

### reduce method

Stream\<A> => B

#### count

``` typescript
NS<T>.count(): number
```

#### include

``` typescript
NS<T>.include(v: T): boolean
```

#### every

``` typescript
NS<T>.include(v: T): boolean
```

#### some

``` typescript
NS<T>.some(f: Predicate<T>): boolean
```

#### first

``` typescript
NS<T>.first(): T | void
```

#### last

``` typescript
NS<T>.last(): T | void
```

#### reduce

``` typescript
NS<T>.reduce<K>(rf: ReduceFunction<T, K>, v: K): K
```

#### foreach

``` typescript
NS<T>.foreach(f: Action<T>): void
```

#### toArray

``` typescript
NS<T>.toArray(): T[]
```

### merge method

Stream\<T>[] => Stream\<T>

#### concat

``` typescript
NS<T>.concat(...nss: NS<T>[]): NS<T>
```

## ans

Async no-stream alias ans, used to create a async stream.

``` typescript
function ans<T>(iter: {
    [Symbol.iterator](): IterableIterator<T>;
} | (() => AsyncIterableIterator<T>)): ANS<T>
```

## ans.ob

Create a async stream by observable.

``` typescript
observable<T>(subscribe: (subscriber: Subscriber<T>) => void | Unsubscribable): ANS<T>
```

## ans.concat

Similar to ns.concat.

## ans.zip

Stream\<A, B, C, ...>[] => Stream\<[A, B, C, ...]>

``` typescript
zip<T extends ANS<any>[]>(...anss_0: T): ANS<Zip<T>>
```

## ans.race

Stream\<T>[] => Stream\<T>

``` typescript
ANS<T>.race<T>(...anss: ANS<T>[]): ANS<T>
```

## ANS

AsyncNoStream alias ANS, similar to NS.