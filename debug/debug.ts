import { ans } from "no-stream";

function delay(n: number) {
  return new Promise((r) => setTimeout(r, n));
}

ans
  .zip(
    ans(async function* () {
      while (true) {
        const x = Math.random();
        await delay(x * 50);
        console.log("1 : " + x);
        if (0.99 < x) {
          throw x + "!";
        }
        yield x;
      }
    }),
    ans(async function* () {
      while (true) {
        const x = Math.random();
        await delay(x * 50);
        console.log("2 : " + x);
        if (0.99 < x) {
          throw x + "!";
        }
        yield x;
      }
    }),
    ans(async function* () {
      while (true) {
        const x = Math.random();
        await delay(x * 50);
        console.log("3 : " + x);
        if (0.99 < x) {
          throw x + "!";
        }
        yield x;
      }
    })
  )
  .take(30)
  .foreach(async (x) => {
    console.log(x);
    await delay(Math.random() * 1);
    if (0.99 < Math.random()) {
      throw "!!!";
    }
  })
  .then(
    () => console.info("end"),
    (e) => console.error(e)
  );
