import { NS } from "./ns";
import { NSR } from "./nsr";

export function ns<T>(
  iter:
    | { [Symbol.iterator](): IterableIterator<T> }
    | (() => IterableIterator<T>)
) {
  return NS.create(iter);
}

ns.concat = NS.concat;

export function nsr<T>() {
  return NSR.create<T>();
}
