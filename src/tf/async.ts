import { AsyncTransduceFunction } from "each-once/async";

export function short<T>(): AsyncTransduceFunction<T, T> {
  return (next) => {
    let continue_ = true;
    return [
      async (x) => {
        if (continue_) {
          try {
            continue_ = await next(x);
            return continue_;
          } catch (e) {
            continue_ = false;
            throw e;
          }
        } else {
          return false;
        }
      },
    ];
  };
}
