export class Symbol {
  readonly #value: string;

  constructor(value: string) {
    if (value.trim().length !== 1) {
      throw new Error("Symbol must be a single character");
    }
    this.#value = value.trim();
  }

  toString(): string {
    return this.#value;
  }
}

export class Word {
  readonly #symbols: Symbol[];

  constructor(symbols: Symbol[]) {
    this.#symbols = symbols;
  }

  get length(): number {
    return this.#symbols.length;
  }

  truncate(cutoff: number): Word {
    return new Word(this.#symbols.slice(0, cutoff));
  }

  toString(): string {
    return this.#symbols.map((symbol) => symbol.toString()).join("");
  }
}

export class NaturalNumber {
  static readonly ZERO = new NaturalNumber(0);
  static readonly ONE = new NaturalNumber(1);

  readonly #value: number;

  constructor(value: number) {
    if (!Number.isInteger(value) || value < 0) {
      throw new Error("NaturalNumber must be a non-negative integer");
    }
    this.#value = value;
  }

  equals(other: NaturalNumber): boolean {
    return this.#value === other.#value;
  }

  plus(other: NaturalNumber): NaturalNumber {
    return new NaturalNumber(this.#value + other.#value);
  }

  minus(other: NaturalNumber): NaturalNumber {
    const result = Math.max(0, this.#value - other.#value);
    return new NaturalNumber(result);
  }

  incremented(): NaturalNumber {
    return new NaturalNumber(this.#value + 1);
  }

  decremented(): NaturalNumber {
    const result = Math.max(0, this.#value - 1);
    return new NaturalNumber(result);
  }

  toJsNumber(): number {
    return this.#value;
  }
}

export type Address = NaturalNumber;

export class NumberEncoding {
  fromWord(word: Word): NaturalNumber {
    const str = word.toString();
    if (str.length === 0) {
      return NaturalNumber.ZERO;
    }
    const num = parseInt(str, 16);
    return new NaturalNumber(num);
  }

  toWord(number: NaturalNumber): Word {
    const str = number.toJsNumber().toString(16).toUpperCase();
    const symbols = str.split("").map((char) => new Symbol(char));
    return new Word(symbols);
  }
}
