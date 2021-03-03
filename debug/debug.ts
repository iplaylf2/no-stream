import { ans } from "no-stream";

function delay(n: number) {
  return new Promise((r) => setTimeout(r, n));
}

let count = 0;
ans
  .ob<number>((s) => {
    (async () => {
      while (true) {
        count++;

        const x = Math.random();
        await delay(x * 50);
        console.log(x + ":");
        s.next(x);
        if (0.95 < x) {
          if (0.98 < x) {
            s.error("zzz");
          } else {
            s.complete();
          }
          return;
        }
      }
    })();
    return () => {
      console.info("uns");
    };
  })
  .take(20)
  .foreach(async (x) => (await delay(10), console.log(x)))
  .then(
    () => {
      console.info(count);
    },
    (x) => {
      console.error(x);
      console.info(count);
    }
  );
