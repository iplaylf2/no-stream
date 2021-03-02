import { AsyncTransduceFunction } from "each-once/transduce/async/type";

export function short<T>(): AsyncTransduceFunction<T, T> {
  return (next) => {
    let continue_ = true;
    return [
      async (x) => {
        if (continue_) {
          continue_ = await next(x);
          return continue_;
        } else {
          return false;
        }
      },
    ];
  };
}
