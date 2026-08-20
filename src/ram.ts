import { Address, NaturalNumber, NumberEncoding, Symbol, Word } from "./values.js";

export { Symbol, Word, NaturalNumber, NumberEncoding };
export type { Address };

export class MemoryCell {
  readonly #capacity: number;
  #content: Word;

  constructor(capacity: number, initialContent: Word = new Word([])) {
    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw new Error("Capacity must be a positive integer");
    }
    this.#capacity = capacity;
    this.#content = initialContent.truncate(capacity);
  }

  read(): Word {
    return this.#content;
  }

  write(word: Word) {
    this.#content = word.truncate(this.#capacity);
  }
}

export class Memory {
  readonly cellCapacity: number;
  readonly #cells: Map<number, MemoryCell>;

  constructor(cellCapacity: number) {
    this.cellCapacity = cellCapacity;
    this.#cells = new Map();
  }

  clear() {
    this.#cells.clear();
  }

  read(location: Address): Word {
    return this.#ensureCellExists(location).read();
  }

  #ensureCellExists(location: Address) {
    let cell = this.#cells.get(location.toJsNumber());
    if (cell === undefined) {
      cell = new MemoryCell(this.cellCapacity);
      this.#cells.set(location.toJsNumber(), cell);
    }
    return cell;
  }

  readBlock(firstAddress: Address, length: number): Word[] {
    const words: Word[] = [];
    for (let offset = 0; offset < length; offset++) {
      const address = firstAddress.plus(new NaturalNumber(offset));
      const word = this.read(address);
      words.push(word);
    }
    return words;
  }

  write(address: NaturalNumber, word: Word) {
    this.#ensureCellExists(address).write(word);
  }

  writeBlock(firstAddress: Address, words: Word[]) {
    for (let offset = 0; offset < words.length; offset++) {
      const address = firstAddress.plus(new NaturalNumber(offset));
      this.write(address, words[offset]);
    }
  }
}

export class Cpu {
  constructor(readonly acc: MemoryCell, readonly ip: MemoryCell) {}
}

export interface IO {
  read(): Word;
  write(word: Word): void;
  reset(): void;
}

export interface Instruction {
  readonly mnemonic: string;
  readonly opCode: NaturalNumber;
  readonly length: number;
  execute(machine: Machine): NaturalNumber[];
}

abstract class AbstractInstruction implements Instruction {
  readonly opCode: NaturalNumber;
  readonly length: number;
  readonly mnemonic: string;

  constructor(mnemonic: string, opCode: number, size: number = 2) {
    this.mnemonic = mnemonic;
    this.opCode = new NaturalNumber(opCode);
    if (size < 1) {
      throw new Error("Instruction length must be at least 1");
    }
    this.length = size;
  }

  ensureOpCodeMatches(opCode: NaturalNumber): void {
    if (!this.opCode.equals(opCode)) {
      throw new Error("Internal error: Opcode mismatch");
    }
  }

  abstract execute(machine: Machine): NaturalNumber[];
}

class Add extends AbstractInstruction {
  constructor(mnemonic: string, opCode: number) {
    super(mnemonic, opCode);
  }

  execute(machine: Machine): NaturalNumber[] {
    const [opCode, address] = machine.readNextInstruction(this.length);
    this.ensureOpCodeMatches(opCode);
    const value = machine.readNumberFromMemoryAt(address);
    const acc = machine.readNumberFromAcc();
    machine.writeNumberToAcc(acc.plus(value));
    machine.incrementIpBy(this.length);
    return [opCode, address];
  }
}

class Subtract extends AbstractInstruction {
  constructor(mnemonic: string, opCode: number) {
    super(mnemonic, opCode);
  }

  execute(machine: Machine): NaturalNumber[] {
    const [opCode, address] = machine.readNextInstruction(this.length);
    this.ensureOpCodeMatches(opCode);
    const value = machine.readNumberFromMemoryAt(address);
    const acc = machine.readNumberFromAcc();
    machine.writeNumberToAcc(acc.minus(value));
    machine.incrementIpBy(this.length);
    return [opCode, address];
  }
}

class JumpIfZero extends AbstractInstruction {
  constructor(mnemonic: string, opCode: number) {
    super(mnemonic, opCode);
  }

  execute(machine: Machine): NaturalNumber[] {
    const [opCode, address] = machine.readNextInstruction(this.length);
    this.ensureOpCodeMatches(opCode);
    const acc = machine.readNumberFromAcc();
    if (acc.equals(NaturalNumber.ZERO)) {
      machine.writeAddressToIp(address);
    } else {
      machine.incrementIpBy(this.length);
    }
    return [opCode, address];
  }
}

class Store extends AbstractInstruction {
  constructor(mnemonic: string, opCode: number) {
    super(mnemonic, opCode);
  }

  execute(machine: Machine): NaturalNumber[] {
    const [opCode, address] = machine.readNextInstruction(this.length);
    this.ensureOpCodeMatches(opCode);
    const value = machine.readWordFromAcc();
    machine.writeWordToMemoryAt(address, value);
    machine.incrementIpBy(this.length);
    return [opCode, address];
  }
}

class Load extends AbstractInstruction {
  constructor(mnemonic: string, opCode: number) {
    super(mnemonic, opCode);
  }

  execute(machine: Machine): NaturalNumber[] {
    const [opCode, address] = machine.readNextInstruction(this.length);
    this.ensureOpCodeMatches(opCode);
    const value = machine.readWordFromMemoryAt(address);
    machine.writeWordToAcc(value);
    machine.incrementIpBy(this.length);
    return [opCode, address];
  }
}

class Set extends AbstractInstruction {
  constructor(mnemonic: string, opCode: number) {
    super(mnemonic, opCode);
  }

  execute(machine: Machine): NaturalNumber[] {
    const [opCode, value] = machine.readNextInstruction(this.length);
    this.ensureOpCodeMatches(opCode);
    machine.writeNumberToAcc(value);
    machine.incrementIpBy(this.length);
    return [opCode, value];
  }
}

class Prompt extends AbstractInstruction {
  constructor(mnemonic: string, opCode: number) {
    super(mnemonic, opCode);
  }

  execute(machine: Machine): NaturalNumber[] {
    const [opCode, address] = machine.readNextInstruction(this.length);
    this.ensureOpCodeMatches(opCode);
    const input = machine.receiveWordFromInput();
    machine.writeWordToMemoryAt(address, input);
    machine.incrementIpBy(this.length);
    return [opCode, address];
  }
}

class Print extends AbstractInstruction {
  constructor(mnemonic: string, opCode: number) {
    super(mnemonic, opCode);
  }

  execute(machine: Machine): NaturalNumber[] {
    const [opCode, address] = machine.readNextInstruction(this.length);
    this.ensureOpCodeMatches(opCode);
    const value = machine.readWordFromMemoryAt(address);
    machine.sendWordToOutput(value);
    machine.incrementIpBy(this.length);
    return [opCode, address];
  }
}

class Halt extends AbstractInstruction {
  constructor(mnemonic: string, opCode: number, size: number = 1) {
    super(mnemonic, opCode, size);
  }

  execute(machine: Machine): NaturalNumber[] {
    const [opCode] = machine.readNextInstruction(this.length);
    this.ensureOpCodeMatches(opCode);
    machine.incrementIpBy(this.length);
    machine.stop();
    return [opCode];
  }

  ensureOpCodeMatches(_opCode: NaturalNumber): void {}
}

export class InstructionSet {
  static standard: InstructionSet = new InstructionSet(
    [
      new Add("ADD", 1),
      new Subtract("SUBTRACT", 2),
      new JumpIfZero("JUMPZ", 3),
      new Store("STORE", 4),
      new Load("LOAD", 5),
      new Set("SET", 6),
      new Prompt("PROMPT", 7),
      new Print("PRINT", 8),
    ],
    new Halt("HALT", 0, 1)
  );

  readonly #instructions: Map<number, Instruction>;
  readonly #defaultInstruction: Instruction;

  constructor(instructions: Array<Instruction>, defaultInstruction: Instruction) {
    this.#defaultInstruction = defaultInstruction;
    this.#instructions = new Map([
      [defaultInstruction.opCode.toJsNumber(), defaultInstruction],
    ]);
    for (const instruction of instructions) {
      const opCode = instruction.opCode.toJsNumber();
      if (this.#instructions.has(opCode)) {
        throw new Error(`Duplicate opcode detected: ${opCode}`);
      }
      this.#instructions.set(opCode, instruction);
    }
  }

  execute(machine: Machine): NaturalNumber[] {
    const [opCode] = machine.readNextInstruction(1);
    return this.#withOpCode(opCode.toJsNumber()).execute(machine);
  }

  #withOpCode(opCode: number): Instruction {
    let instruction = this.#instructions.get(opCode);
    if (instruction === undefined) {
      instruction = this.#defaultInstruction;
    }
    return instruction;
  }

  withMnemonic(mnemonic: string): Instruction {
    for (const instruction of this.#instructions.values()) {
      if (instruction.mnemonic === mnemonic) {
        return instruction;
      }
    }
    throw new Error(`Unknown instruction mnemonic: ${mnemonic}`);
  }
}

export interface Listener {
  onInstructionExecuted(instruction: NaturalNumber[]): void;
  onMemoryUpdated(address: Address, oldValue: Word, newValue: Word): void;
  onAccUpdated(oldValue: Word, newValue: Word): void;
  onIpUpdated(oldValue: Word, newValue: Word): void;
  onInput(word: Word): void;
  onOutput(word: Word): void;
  onMachineStarted(): void;
  onMachineStopped(): void;
}

// No-op implementation so callers can extend/compose without retyping empty handlers.
export class DefaultListener implements Listener {
  onInstructionExecuted(_instruction: NaturalNumber[]): void {}
  onMemoryUpdated(_address: Address, _oldValue: Word, _newValue: Word): void {}
  onAccUpdated(_oldValue: Word, _newValue: Word): void {}
  onIpUpdated(_oldValue: Word, _newValue: Word): void {}
  onInput(_word: Word): void {}
  onOutput(_word: Word): void {}
  onMachineStarted(): void {}
  onMachineStopped(): void {}
}

export class Machine {
  static create(io: IO, instructions: InstructionSet = InstructionSet.standard): Machine {
    const numbers = new NumberEncoding();
    const cellCapacity = 10;
    const memory = new Memory(cellCapacity);
    const cpu = new Cpu(new MemoryCell(cellCapacity), new MemoryCell(cellCapacity));
    return new Machine(numbers, instructions, memory, cpu, io);
  }

  readonly numbers: NumberEncoding;
  readonly instructions: InstructionSet;
  readonly #memory: Memory;
  readonly #cpu: Cpu;
  readonly #io: IO;
  readonly #listeners: globalThis.Set<Listener>;

  #isRunning = false;

  constructor(
    numbers: NumberEncoding,
    instructions: InstructionSet,
    memory: Memory,
    cpu: Cpu,
    io: IO
  ) {
    this.numbers = numbers;
    this.instructions = instructions;
    this.#memory = memory;
    this.#cpu = cpu;
    this.#io = io;
    this.#listeners = new globalThis.Set<Listener>();
  }

  get isRunning(): boolean {
    return this.#isRunning;
  }

  addListener(listener: Listener): void {
    this.#listeners.add(listener);
  }

  removeListener(listener: Listener): void {
    this.#listeners.delete(listener);
  }

  readNumberFromAcc(): NaturalNumber {
    return this.numbers.fromWord(this.#cpu.acc.read());
  }

  readWordFromAcc(): Word {
    return this.#cpu.acc.read();
  }

  writeNumberToAcc(value: NaturalNumber): void {
    this.writeWordToAcc(this.numbers.toWord(value));
  }

  writeWordToAcc(value: Word): void {
    const oldValue = this.#cpu.acc.read();
    this.#cpu.acc.write(value);
    this.#listeners.forEach((l) => l.onAccUpdated(oldValue, value));
  }

  readIpAsAddress(): Address {
    return this.numbers.fromWord(this.#cpu.ip.read());
  }

  writeAddressToIp(value: Address): void {
    const oldValue = this.#cpu.ip.read();
    this.#cpu.ip.write(this.numbers.toWord(value));
    this.#listeners.forEach((l) => l.onIpUpdated(oldValue, this.#cpu.ip.read()));
  }

  incrementIpBy(offset: number): void {
    const currentIp = this.readIpAsAddress();
    const newIp = currentIp.plus(new NaturalNumber(offset));
    this.writeAddressToIp(newIp);
  }

  readNextInstruction(length: number): NaturalNumber[] {
    const ip = this.readIpAsAddress();
    return this.#memory.readBlock(ip, length).map((word) => this.numbers.fromWord(word));
  }

  readNumberFromMemoryAt(address: Address): NaturalNumber {
    return this.numbers.fromWord(this.#memory.read(address));
  }

  readWordFromMemoryAt(address: Address): Word {
    return this.#memory.read(address);
  }

  writeWordToMemoryAt(address: Address, value: Word): void {
    const oldValue = this.#memory.read(address);
    this.#memory.write(address, value);
    this.#listeners.forEach((l) => l.onMemoryUpdated(address, oldValue, value));
  }

  writeNumberToMemoryAt(address: Address, value: NaturalNumber): void {
    this.writeWordToMemoryAt(address, this.numbers.toWord(value));
  }

  receiveWordFromInput(): Word {
    const word = this.#io.read();
    this.#listeners.forEach((l) => l.onInput(word));
    return word;
  }

  sendWordToOutput(value: Word): void {
    this.#io.write(value);
    this.#listeners.forEach((l) => l.onOutput(value));
  }

  reset(): void {
    this.#cpu.acc.write(this.numbers.toWord(NaturalNumber.ZERO));
    this.#cpu.ip.write(this.numbers.toWord(NaturalNumber.ZERO));
    this.#memory.clear();
    this.#io.reset();
    this.#isRunning = false;
  }

  step(): void {
    const instruction = this.instructions.execute(this);
    this.#listeners.forEach((l) => l.onInstructionExecuted(instruction));
  }

  run(): void {
    this.#start();
    while (this.#isRunning) {
      this.step();
    }
  }

  #start(): void {
    this.#isRunning = true;
    this.#listeners.forEach((l) => l.onMachineStarted());
  }

  start(): void {
    this.#start();
  }

  stop(): void {
    this.#isRunning = false;
    this.#listeners.forEach((l) => l.onMachineStopped());
  }

  load(segment: MemorySegment): void {
    this.#memory.writeBlock(segment.address, segment.words);
  }
}

export class MemorySegment {
  constructor(readonly address: Address, readonly words: Array<Word>) {}

  get size(): NaturalNumber {
    return new NaturalNumber(this.words.length);
  }

  push(word: Word): void {
    this.words.push(word);
  }
}

// Convenience aggregate for consumers expecting a namespace-like object.
export const RAM = {
  Symbol,
  Word,
  MemoryCell,
  NaturalNumber,
  Memory,
  Cpu,
  InstructionSet,
  NumberEncoding,
  Machine,
  MemorySegment,
  DefaultListener,
};
