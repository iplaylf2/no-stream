# no-stream

Like stream, but no stream.

English | [中文](https://github.com/Iplaylf2/no-stream/blob/main/doc/README.cn.md)
-

## feature

- Similar to array, easy to use.
- Support async.
- Efficient.

## install

``` bash
npm install no-stream
```

## usage

``` typescript
import { ns } from "no-stream";

const s = ns(function* () {
  let x = 0;
  while (true) {
    yield x++;
  }
}); // ns([0, 1, 2...])

const result = s
  .map((x) => x * 2)
  .filter((x) => x % 4 === 0)
  .take(10)
  .reduce((r, x) => r + x, 0);

console.log(result); // 180

```

## benchmark

Benchmark which map n times and reduce once. [from benchmark.ts](https://github.com/Iplaylf2/no-stream/blob/main/debug/benchmark.ts)

array

| map times \ ops/sec \  array length | 100     | 1000  | 10000 | 100000 |
| ----------------------------------- | ------- | ----- | ----- | ------ |
| 2                                   | 1159961 | 23041 | 2462  | 184    |
| 3                                   | 184536  | 19075 | 1947  | 140    |
| 4                                   | 151335  | 13333 | 1561  | 114    |
| 5                                   | 127720  | 12334 | 1359  | 90.35  |
  

no-stream

| map times \ ops/sec \  array length | 100    | 1000  | 10000 | 100000 |
| ----------------------------------- | ------ | ----- | ----- | ------ |
| 2                                   | 400500 | 45295 | 4820  | 481    |
| 3                                   | 276977 | 34394 | 3599  | 349    |
| 4                                   | 216729 | 26527 | 2751  | 265    |
| 5                                   | 180349 | 22585 | 2199  | 224    |
  

**no-stream is more efficient!**

## [document](https://github.com/Iplaylf2/no-stream/blob/main/doc/document.md)