export class Signal {
  block() {
    this.p = new Promise((r) => (this.r = r));
  }

  unblock() {
    this.r();
  }

  get wait() {
    return this.p;
  }

  private p!: Promise<void>;
  private r!: () => void;
}
