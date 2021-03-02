import { ans } from "no-stream";

function delay(n: number) {
  return new Promise((r) => setTimeout(r, n));
}

ans
  .race(
    ans(async function* () {
      while (true) {
        await delay(Math.random() * 100);
        console.log(1 + ":");
        yield 1;
      }
    }),
    ans(async function* () {
      while (true) {
        await delay(Math.random() * 200);
        console.log(2 + ":");
        yield 2;
      }
    }),
    ans(async function* () {
      while (true) {
        await delay(Math.random() * 300);
        console.log(3 + ":");
        yield 3;
      }
    })
  )
  .take(30)
  .foreach(async (x) => (await delay(300), console.log(x)));
