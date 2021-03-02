import { ns, nsr } from "no-stream";

ns([1, 2, 3])
  .concat(ns([4, 5, 6]), ns([7, 8, 9]))
  .take(7)
  .foreach((x) => console.log(x));
