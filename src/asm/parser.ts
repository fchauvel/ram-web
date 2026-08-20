import {
  Action,
  ArithmeticOperation,
  ArithmeticOperator,
  CodeSegment,
  DataSegment,
  DataDeclaration,
  Expression,
  Identifier,
  Instruction,
  Label,
  MacroDeclaration,
  MacroCall,
  Mnemonic,
  NumberLiteral,
  ParameterReference,
  Program,
  Section,
} from "./ast.js";
import { Token, TokenKind } from "./lexer.js";

export class SyntaxError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SyntaxError";
  }
}

export class Parser {
  #position: number;
  constructor(readonly tokens: Array<Token>) {
    this.#position = 0;
  }

  parse(): Program {
    const sections = this.#oneOrMore(() => this.section());
    return new Program(sections);
  }

  section(): Section {
    return this.#eitherOf<Section>([
      () => this.dataSegment(),
      () => this.codeSegment(),
      () => this.macro(),
    ]);
  }

  dataSegment(): DataSegment {
    const markup = this.#one(() => this.token(TokenKind.DataSegment));
    const declarations = this.#zeroOrMore(() => this.declaration());
    const span =
      declarations.length == 0
        ? markup.span
        : markup.span.join(declarations.at(-1)!.span);
    return new DataSegment(declarations, span);
  }

  declaration(): DataDeclaration {
    const identifier = this.#one(() => this.identifier());
    const initialValues = this.#oneOrMore(() => this.naturalNumber());
    const span = identifier.span.join(initialValues.at(-1)!.span);
    return new DataDeclaration(identifier, initialValues, span);
  }

  codeSegment(): CodeSegment {
    const markup = this.#one(() => this.token(TokenKind.CodeSegment));
    const actions = this.#oneOrMore(() => this.action());
    const lastAction = actions.at(-1);
    return new CodeSegment(actions, markup.span.join(lastAction!.span));
  }

  macro(): MacroDeclaration {
    const markup = this.#one(() => this.token(TokenKind.MacroSegment));
    const name = this.#one(() => this.identifier());
    const parameters = this.#zeroOrMore(() => this.identifier());
    const instructions = this.#zeroOrMore(() => this.instruction());
    const endMarkup = this.#one(() => this.token(TokenKind.MacroEnd));
    const span = markup.span.join(endMarkup.span);
    return new MacroDeclaration(name, parameters, instructions, span);
  }

  action(): Action {
    return this.#eitherOf<Action>([
      () => this.instruction(),
      () => this.macroCall(),
    ]);
  }

  instruction(): Instruction {
    const label = this.#zeroOrOne(() => this.label());
    const mnemonic = this.#one(() => this.mnemonic());
    const operand = this.#zeroOrOne(() => this.expression());
    const firstNode = label ?? mnemonic;
    const lastNode = operand === undefined ? mnemonic : operand;
    return new Instruction(
      mnemonic,
      operand,
      label,
      firstNode.span.join(lastNode.span)
    );
  }

  macroCall(): MacroCall {
    const label = this.#zeroOrOne(() => this.label());
    const name = this.#one(() => this.identifier());
    const args = this.#zeroOrMore(() => this.expression(), {
      separator: () => this.token(TokenKind.COMMA),
    });
    const firstNode = label ?? name;
    const lastNode = args.length > 0 ? args.at(-1)! : name;
    return new MacroCall(name, args, label, firstNode.span.join(lastNode.span));
  }

  expression(): Expression {
    return this.#eitherOf<Expression>([
      () => this.arithmeticOperation(),
      () => this.parameter(),
      () => this.identifier(),
      () => this.naturalNumber(),
    ]);
  }

  arithmeticOperation(): Expression {
    const left = this.#eitherOf<Expression>([
      () => this.identifier(),
      () => this.naturalNumber(),
    ]);
    const operator = this.arithmeticOperator();
    const right = this.naturalNumber();
    const span = left.span.join(right.span);
    return new ArithmeticOperation(left, operator, right, span);
  }

  arithmeticOperator(): ArithmeticOperator {
    const operatorToken = this.#eitherOf<Token>([
      () => this.token(TokenKind.PLUS),
      () => this.token(TokenKind.MINUS),
    ]);
    let operator: ArithmeticOperator = ArithmeticOperator.PLUS;
    if (operatorToken.kind.equals(TokenKind.PLUS)) {
      operator = ArithmeticOperator.PLUS;
    } else if (operatorToken.kind.equals(TokenKind.MINUS)) {
      operator = ArithmeticOperator.MINUS;
    } else {
      throw new Error(`Unknown arithmetic operator: ${operatorToken.text}`);
    }
    return operator;
  }

  mnemonic(): Mnemonic {
    const token = this.#one(() => this.token(TokenKind.Mnemonic));
    return new Mnemonic(token.text, token.span);
  }

  identifier(): Identifier {
    const token = this.#one(() => this.token(TokenKind.Identifier));
    return new Identifier(token.text, token.span);
  }

  naturalNumber(): NumberLiteral {
    const token = this.#one(() => this.token(TokenKind.NaturalNumber));
    const value = parseInt(token.text, 10);
    return new NumberLiteral(value, token.span);
  }

  label(): Label {
    const token = this.#one(() => this.token(TokenKind.Label));
    return new Label(token.text.slice(0, -1), token.span);
  }

  parameter(): ParameterReference {
    const token = this.#one(() => this.token(TokenKind.Parameter));
    return new ParameterReference(token.text.slice(1, -1), token.span);
  }

  #one<T>(rule: () => T): T {
    return rule();
  }

  #zeroOrOne<T>(rule: () => T): T | undefined {
    try {
      return rule();
    } catch {
      return undefined;
    }
  }

  #zeroOrMore<T, S>(
    rule: () => T,
    options: { separator?: () => S } = {}
  ): Array<T> {
    const { separator = () => undefined } = options;
    const production = new Array<T>();
    let ruleApply = true;
    while (ruleApply) {
      try {
        const result = rule();
        production.push(result);
        separator();
      } catch {
        ruleApply = false;
      }
    }
    return production;
  }

  #oneOrMore<T, S>(
    rule: () => T,
    options: { separator?: () => S } = {}
  ): Array<T> {
    const { separator = () => undefined } = options;
    const production = [rule()];
    let ruleApply = true;
    while (ruleApply) {
      try {
        separator();
        production.push(rule());
      } catch {
        ruleApply = false;
      }
    }
    return production;
  }

  #eitherOf<T>(rules: Array<() => T>): T {
    const errors = new Array<Error>();
    for (const rule of rules) {
      try {
        return rule();
      } catch (error) {
        errors.push(error as Error);
        continue;
      }
    }
    throw new SyntaxError(
      "No rule matched: " + errors.map((e) => e.message).join("; ")
    );
  }

  token(expected: TokenKind): Token {
    const token = this.#peekAtNextToken;
    if (token == undefined) {
      throw new SyntaxError("Unexpected end of token stream");
    }
    if (!token.kind.equals(expected)) {
      throw new SyntaxError(
        `Expected token of kind ${expected.name}, got ${token.kind.name}`
      );
    }
    this.#position++;
    return token;
  }
  
  get #nextToken(): Token | undefined {
    if (this.#position < this.tokens.length) {
      return this.tokens[this.#position];
    }
    return undefined;
  }
}
