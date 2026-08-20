import { Assembler, Assembly, Lexer, Token } from "../../src/asm.js";
import {
  InstructionSet,
  IO,
  Machine,
  MemorySegment,
  NaturalNumber,
  NumberEncoding,
  Word,
} from "../../src/ram.js";
import { formatSource } from "../../src/asm/formatter.js";
import * as assert from "node:assert/strict";

export class TestIO implements IO {
  #encoding: NumberEncoding;
  #inputs: Array<Word>;
  #output: Array<Word>;

  constructor(encoding: NumberEncoding, inputs: Array<number>) {
    this.#encoding = encoding;
    this.#inputs = [];
    this.setInputs(inputs);
    this.#output = [];
  }

  read(): Word {
    if (this.#inputs.length == 0) {
      throw new Error("Invalid state: Noinput available");
    }
    return this.#inputs.shift()!;
  }

  write(word: Word): void {
    this.#output.push(word);
  }

  reset(): void {
    this.#inputs = [];
    this.#output = [];
  }

  setInputs(inputs: Array<number>): void {
    this.#inputs = [];
    for (const i of inputs) {
      const natural = new NaturalNumber(i);
      const word = this.#encoding.toWord(natural);
      this.#inputs.push(word);
    }
  }

  get outputs(): Array<number> {
    const result: Array<number> = [];
    for (const word of this.#output) {
      const natural = this.#encoding.fromWord(word);
      result.push(natural.toJsNumber());
    }
    return result;
  }
}

export class TestDriver {
  readonly encoding: NumberEncoding;
  io: TestIO;
  ram: Machine;
  readonly assembler: Assembler;

  constructor() {
    this.encoding = new NumberEncoding();
    this.io = new TestIO(this.encoding, []);
    this.assembler = new Assembler(InstructionSet.standard);
    this.ram = Machine.create(this.io);
  }

  resetMachine(): void {
    this.ram.reset();
  }

  tokenize(source: string): Array<Token> {
    const lexer = new Lexer(source);
    return Array.from(lexer.tokenize());
  }

  verifyTokens(actual: Array<Token>, expected: Array<{ kind: string; text: string }>): void {
    assert.strictEqual(
      actual.length,
      expected.length,
      `Number of tokens should be ${expected.length} (was ${actual.length})`
    );
    for (const [index, token] of expected.entries()) {
      const actualToken = actual[index];
      assert.ok(actualToken, `Token at index ${index} should exist`);
      assert.strictEqual(
        actualToken.kind.name,
        token.kind,
        `Token at index ${index} should be of kind ${token.kind} (was ${actualToken.kind.name})`
      );
      assert.strictEqual(
        actualToken.text,
        token.text,
        `Token at index ${index} should have text "${token.text}" (was "${actualToken.text}")`
      );
    }
  }

  loadAndRun(source: string, inputs: Array<number> = []): Assembly {
    this.ram.reset();
    this.io.setInputs(inputs);
    const dataSegment = new MemorySegment(NaturalNumber.ZERO, []);
    const codeSegment = new MemorySegment(new NaturalNumber(20), []);
    const assembly = new Assembly(codeSegment, dataSegment);
    this.assembler.assemble(source, assembly, this.ram.numbers);
    assembly.loadInto(this.ram);
    this.ram.run();
    return assembly;
  }

  formatCode(source: string): string {
    return formatSource(source);
  }

  formatCodeWithMargin(source: string): string {
    return formatSource(stripMargin(source));
  }

  verifyFormatted(actual: string, expected: string): void {
    assert.strictEqual(actual, expected);
  }

  verifyFormattedWithMargin(actual: string, expected: string): void {
    assert.strictEqual(actual, stripMargin(expected));
  }

  verify(expectations: MachineState): void {
    assert.strictEqual(
      this.ram.isRunning,
      expectations.running,
      `Machine running state should be ${expectations.running}`
    );
    this.verifyRegister(expectations.acc, "acc");
    this.verifyRegister(expectations.ip, "ip");
    this.verifyMemory(expectations.memory);
    if (expectations.output) {
      assert.deepStrictEqual(
        this.io.outputs,
        expectations.output,
        `Output should match expected values`
      );
    }
  }

  verifyRegister(expectedValue: number, registerName: "acc" | "ip"): void {
    const actualValue =
      registerName === "acc"
        ? this.ram.readNumberFromAcc()
        : this.ram.readIpAsAddress();
    assert.strictEqual(
      actualValue.toJsNumber(),
      expectedValue,
      `${registerName.toUpperCase()} should be ${expectedValue} (was ${actualValue.toJsNumber()})`
    );
  }
  verifyMemory(expectedValues: Array<MemoryCell>): void {
    for (const { address, value } of expectedValues) {
      const actualValue = this.ram.readNumberFromMemoryAt(
        new NaturalNumber(address)
      );
      assert.strictEqual(
        actualValue.toJsNumber(),
        value,
        `Memory at address ${address} should be ${value} (was ${actualValue.toJsNumber()})`
      );
    }
  }
}

type MachineState = {
  running: boolean;
  acc: number;
  ip: number;
  memory: Array<MemoryCell>;
  output?: Array<number>;
};

type MemoryCell = {
  address: number;
  value: number;
};

function stripMargin(text: string, marker = "|"): string {
  return text
    .split("\n")
    .map((line) => {
      const idx = line.indexOf(marker);
      return idx >= 0 ? line.slice(idx + 1) : line;
    })
    .join("\n")
    .trim();
}
