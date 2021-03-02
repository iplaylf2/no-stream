import { ns } from "no-stream";
import { Suite } from "benchmark";

const world = function (map_count: number, arr_size: number) {
  console.log(`Map ${map_count} times, length is ${arr_size}.`);
  const data = new Array(arr_size).fill(0);

  const mf = (x: number) => x + 1;
  const rf = (r: number, x: number) => r + x;

  // add tests
  new Suite()
    .add("array", function () {
      let d = data;
      for (let i = 0; i !== map_count; i++) {
        d = d.map(mf);
      }
      d.reduce(rf, 0);
    })
    .add("no-stream", function () {
      let d = ns(data);
      for (let i = 0; i !== map_count; i++) {
        d = d.map(mf);
      }
      d.reduce(rf, 0);
    })
    // add listeners
    .on("cycle", function (event: any) {
      console.log(String(event.target));
    })
    .on("complete", function (this: any) {
      console.log("Fastest is " + this.filter("fastest").map("name"));
    })
    // run async
    .run({ async: false });
};

for (let a = 2; a <= 5; a++) {
  for (let b = 100; b <= 100000; b *= 10) {
    world(a, b);
  }
}
