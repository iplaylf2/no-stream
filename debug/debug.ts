import { ans } from "no-stream";

function delay(n: number) {
  return new Promise((r) => setTimeout(r, n));
}

ans
  .race(
    ans(async function* () {
      while (true) {
        await delay(Math.random() * 10);
        console.log(1);
        yield Math.random();
      }
    }),
    ans(async function* () {
      while (true) {
        await delay(Math.random() * 20);
        console.log(2);
        yield Math.random();
      }
    }),
    ans(async function* () {
      while (true) {
        await delay(Math.random() * 30);
        console.log(3);
        yield Math.random();
      }
    })
  )
  .take(30)
  .foreach(async (x) => (await delay(100), console.log(x)));
