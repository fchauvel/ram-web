import {
  Address,
  InstructionSet,
  Machine,
  MemorySegment,
  NaturalNumber,
  NumberEncoding,
  Word,
} from "../ram.js";
import {
  AstVisitor,
  CodeSegment,
  DataDeclaration,
  DataSegment,
  Identifier,
  Instruction,
  Label,
  NumberLiteral,
  Program,
} from "./ast.js";
import { Lexer, Token, TokenKind } from "./lexer.js";
import { expandMacroCalls } from "./macro.js";
import { Parser } from "./parser.js";

export class Assembly {
  readonly symbols: SymbolTable;

  constructor(
    readonly code: MemorySegment,
    readonly data: MemorySegment,
    symbols: SymbolTable = new SymbolTable()
  ) {
    this.symbols = symbols;
  }

  loadInto(ramMachine: Machine): void {
    ramMachine.load(this.data);
    ramMachine.load(this.code);
    ramMachine.writeAddressToIp(this.code.address);
  }
}

export class Assembler {
  constructor(readonly instructionSet: InstructionSet) {}

  assemble(source: string, assembly: Assembly, encoding: NumberEncoding): void {
    const ast = expandMacroCalls(this.#buildAst(source));
    ast.accept(
      new VariableCollector(
        assembly.symbols,
        assembly.data.address,
        assembly.code.address,
        this.instructionSet
      )
    );
    ast.accept(
      new CodeGenerator(
        assembly.symbols,
        encoding,
        assembly,
        this.instructionSet
      )
    );
  }

  #buildAst(source: string): Program {
    const lexer = new Lexer(source);
    const parser = new Parser(new Array<Token>(...lexer.tokenize()));
    return parser.parse();
  }
}

class VariableCollector extends AstVisitor {
  #symbolTable: SymbolTable;
  #dataAddress: Address;
  #codeAddress: Address;
  #instructionSet: InstructionSet;

  constructor(
    symbolTable: SymbolTable,
    dataOffset: Address,
    codeOffset: Address,
    instructionSet: InstructionSet
  ) {
    super();
    this.#symbolTable = symbolTable;
    this.#dataAddress = dataOffset;
    this.#codeAddress = codeOffset;
    this.#instructionSet = instructionSet;
  }

  allocateDataAddress(): Address {
    const address = this.#dataAddress;
    this.#dataAddress = this.#dataAddress.incremented();
    return address;
  }

  override visitProgram(node: Program): void {
    for (const section of node.sections) {
      section.accept(this);
    }
  }

  override visitDataSegment(node: DataSegment): void {
    for (const declaration of node.declarations) {
      declaration.accept(this);
    }
  }

  override visitDataDeclaration(node: DataDeclaration): void {
    const name = node.identifier.name;
    this.#symbolTable.defineVariable(name, this.allocateDataAddress());
    // Reserve space for all initial values
    for (let i = 1; i < node.initialValues.length; i++) {
      this.allocateDataAddress();
    }
  }

  override visitCodeSegment(node: CodeSegment): void {
    for (const action of node.actions) {
      action.accept(this);
    }
  }

  override visitInstruction(node: Instruction): void {
    if (node.label) {
      this.#symbolTable.defineVariable(node.label.name, this.#codeAddress);
    }
    const instruction = this.#instructionSet.withMnemonic(node.mnemonic.name);
    this.#codeAddress = this.#codeAddress.plus(
      new NaturalNumber(instruction.length)
    );
  }
}

class CodeGenerator extends AstVisitor {
  #encoding: NumberEncoding;
  #symbolTable: SymbolTable;
  #assembly: Assembly;
  #operand: NaturalNumber | undefined;
  #instructionSet: InstructionSet;

  constructor(
    symbolTable: SymbolTable,
    encoding: NumberEncoding,
    assembly: Assembly,
    instructionSet: InstructionSet
  ) {
    super();
    this.#symbolTable = symbolTable;
    this.#encoding = encoding;
    this.#assembly = assembly;
    this.#operand = undefined;
    this.#instructionSet = instructionSet;
  }

  get #lastOperand(): NaturalNumber {
    if (this.#operand == undefined) {
      throw new Error("Invalid state: Operand is not defined");
    }
    return this.#operand;
  }

  #clearLastOperand(): void {
    this.#operand = undefined;
  }

  override visitProgram(node: Program): void {
    for (const section of node.sections) {
      section.accept(this);
    }
  }

  override visitDataSegment(node: DataSegment): void {
    for (const declaration of node.declarations) {
      declaration.accept(this);
    }
  }

  override visitDataDeclaration(node: DataDeclaration): void {
    const initialValues = node.initialValues.map(value => new NaturalNumber(value.value));
    for (const initialValue of initialValues) {
      const word = this.#encoding.toWord(initialValue);
      this.#assembly.data.push(word);
    }
  }

  override visitCodeSegment(node: CodeSegment): void {
    for (const action of node.actions) {
      action.accept(this);
    }
  }

  override visitIdentifier(node: Identifier): void {
    this.#operand = this.#symbolTable.addressOf(node.name);
  }

  override visitNumberLiteral(node: NumberLiteral): void {
    this.#operand = new NaturalNumber(node.value);
  }

  override visitInstruction(node: Instruction): void {
    node.operand?.accept(this);
    const instruction = this.#instructionSet.withMnemonic(node.mnemonic.name);
    this.#assembly.code.push(this.#encoding.toWord(instruction.opCode));

    const operandCount = instruction.length - 1;
    for (let i = 0; i < operandCount; i++) {
      if (node.operand != undefined && i === 0) {
        this.#assembly.code.push(this.#encoding.toWord(this.#lastOperand));
      } else {
        this.#assembly.code.push(this.#encoding.toWord(NaturalNumber.ZERO));
      }
    }
    this.#clearLastOperand();
  }
}

export class SymbolTable {
  #symbols: Map<string, Variable>;

  constructor() {
    this.#symbols = new Map<string, Variable>();
  }

  defineVariable(name: string, address: Address): void {
    if (this.#symbols.has(name)) {
      throw new Error(`Variable ${name} is already defined`);
    }
    this.#symbols.set(name, new Variable(name, address));
  }

  addressOf(name: string): Address {
    const variable = this.#symbols.get(name);
    if (variable == undefined) {
      throw new Error(`Variable ${name} is not defined`);
    }
    return variable.address;
  }

  getAll(): Map<string, number> {
    const result = new Map<string, number>();
    this.#symbols.forEach((variable, name) => {
      result.set(name, variable.address.toJsNumber());
    });
    return result;
  }
}

class Variable {
  readonly name: string;
  readonly address: Address;

  constructor(name: string, address: Address) {
    this.name = name;
    this.address = address;
  }
}
