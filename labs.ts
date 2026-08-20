

interface Stream<T> {
  hasNext(): boolean;
  next(): T;
}

class BufferedStream<T> implements Stream<T> {
  #buffer: Array<T> = [];
  #marks: Array<number> = [0];
  #source: Stream<T>;

  constructor(source: Stream<T>) {
    this.#source = source;
  }

  next(): T {
    if (this.#hasBufferedItems) {
      const item = this.#buffer[this.#mark];
      this.#incrementMark();
      return item;
    } else if (this.#source.hasNext()) {
      const item = this.#source.next();
      this.#buffer.push(item);
      this.#incrementMark();
      return item;
    }
    throw new Error("No more items in stream");
  }

  #incrementMark(): void {
    this.#marks[this.#marks.length - 1]++;
  }

  get #mark(): number {
    return this.#marks.at(-1)!;
  }

  get #hasBufferedItems(): boolean {
    return this.#mark < this.#buffer.length;
  }

  hasNext(): boolean {
    return this.#hasBufferedItems || this.#source.hasNext();
  }

  begin(): void {
    this.#marks.push(this.#mark);
  }

  commit(): void {
    this.#buffer = this.#buffer.slice(this.#mark);
    this.#marks.pop();
  }

  rollback(): void {
    if (this.#marks.length == 0) {
      throw new Error("Invalid state: No mark to rollback to");  
    }
    this.#marks.pop();
  }

}