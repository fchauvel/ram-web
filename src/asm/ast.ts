import { TextSpan } from "./lexer.js";

export abstract class AstVisitor {
  // Branches
  visitProgram(node: Program): void {}
  visitDataSegment(node: DataSegment): void {}
  visitDataDeclaration(node: DataDeclaration): void {}
  visitCodeSegment(node: CodeSegment): void {}
  visitMacroDeclaration(node: MacroDeclaration): void {}
  visitInstruction(node: Instruction): void {}
  visitMacroCall(node: MacroCall): void {}
  visitArithmeticOperation(node: ArithmeticOperation): void {}
  // Terminals
  visitMnemonic(node: Mnemonic): void {}
  visitIdentifier(node: Identifier): void {}
  visitNumberLiteral(node: NumberLiteral): void {}
  visitLabel(node: Label): void {}
  visitParameterReference(node: ParameterReference): void {}
}

export abstract class AstNode {
  readonly span: TextSpan;
  constructor(span: TextSpan = TextSpan.empty()) {
    this.span = span;
  }

  abstract accept(walker: AstVisitor): void;
}

export class Program extends AstNode {
  constructor(
    readonly sections: Array<Section>,
    span: TextSpan = TextSpan.empty()
  ) {
    super(span);
  }

  accept(walker: AstVisitor): void {
    walker.visitProgram(this);
  }
}

export abstract class Section extends AstNode {
  constructor(span: TextSpan = TextSpan.empty()) {
    super(span);
  }
}

export class DataSegment extends Section {
  readonly declarations: Array<AstNode>;

  constructor(declarations: Array<AstNode>, span: TextSpan = TextSpan.empty()) {
    super(span);
    this.declarations = declarations;
  }

  accept(walker: AstVisitor): void {
    walker.visitDataSegment(this);
  }
}

export class DataDeclaration extends AstNode {
  readonly identifier: Identifier;
  readonly initialValues: NumberLiteral[];

  constructor(
    identifier: Identifier,
    initialValues: NumberLiteral[],
    span: TextSpan = TextSpan.empty()
  ) {
    super(span);
    this.identifier = identifier;
    this.initialValues = initialValues;
  }

  accept(walker: AstVisitor): void {
    walker.visitDataDeclaration(this);
  }
}

export class CodeSegment extends Section {
  readonly actions: Array<Action>;

  constructor(actions: Array<Action>, span: TextSpan = TextSpan.empty()) {
    super(span);
    this.actions = actions;
  }

  accept(walker: AstVisitor): void {
    walker.visitCodeSegment(this);
  }
}

export class MacroDeclaration extends Section {
  readonly name: Identifier;
  readonly parameters: Identifier[];
  readonly body: Array<Action>;

  constructor(
    name: Identifier,
    parameters: Identifier[],
    body: Array<Action>,
    span: TextSpan = TextSpan.empty()
  ) {
    super(span);
    this.name = name;
    this.parameters = parameters;
    this.body = body;
  }

  accept(walker: AstVisitor): void {
    walker.visitMacroDeclaration(this);
  }
}

export abstract class Action extends AstNode {
  readonly label?: Label;
  constructor(label: Label | undefined, span: TextSpan = TextSpan.empty()) {
    super(span);
    this.label = label;
  }
}

export class Instruction extends Action {
  constructor(
    readonly mnemonic: Mnemonic,
    readonly operand: Expression | undefined,
    label: Label | undefined,
    span: TextSpan = TextSpan.empty()
  ) {
    super(label, span);
  }

  accept(walker: AstVisitor): void {
    walker.visitInstruction(this);
  }
}

export class MacroCall extends Action {
  constructor(
    readonly name: Identifier,
    readonly args: Array<Expression>,
    label: Label | undefined,
    span: TextSpan = TextSpan.empty()
  ) {
    super(label, span);
    this.name = name;
  }

  accept(walker: AstVisitor): void {
    walker.visitMacroCall(this);
  }
}

export abstract class Expression extends AstNode {}

export class Identifier extends Expression {
  readonly name: string;

  constructor(name: string, span: TextSpan = TextSpan.empty()) {
    super(span);
    this.name = name;
  }

  accept(walker: AstVisitor): void {
    walker.visitIdentifier(this);
  }
}

export class NumberLiteral extends Expression {
  readonly value: number;

  constructor(value: number, span: TextSpan = TextSpan.empty()) {
    super(span);
    this.value = value;
  }

  accept(walker: AstVisitor): void {
    walker.visitNumberLiteral(this);
  }
}

export class Label extends AstNode {
  readonly name: string;

  constructor(name: string, span: TextSpan = TextSpan.empty()) {
    super(span);
    this.name = name;
  }

  accept(walker: AstVisitor): void {
    walker.visitLabel(this);
  }
}

export class Mnemonic extends AstNode {
  readonly name: string;

  constructor(name: string, span: TextSpan = TextSpan.empty()) {
    super(span);
    this.name = name;
  }

  accept(walker: AstVisitor): void {
    walker.visitMnemonic(this);
  }
}

export class ParameterReference extends Expression {
  readonly parameterName: string;

  constructor(name: string, span: TextSpan = TextSpan.empty()) {
    super(span);
    this.parameterName = name;
  }

  accept(walker: AstVisitor): void {
    walker.visitParameterReference(this);
  }
}

export enum ArithmeticOperator {
  PLUS = "+",
  MINUS = "-",
}

export class ArithmeticOperation extends Expression {
  readonly left: Expression;
  readonly operator: ArithmeticOperator;
  readonly right: NumberLiteral;

  constructor(
    left: Expression,
    operator: ArithmeticOperator,
    right: NumberLiteral,
    span: TextSpan = TextSpan.empty()
  ) {
    super(span);
    this.left = left;
    this.operator = operator;
    this.right = right;
  }

  get children(): Array<AstNode> {
    return [this.left, this.right];
  }

  accept(walker: AstVisitor): void {
    walker.visitArithmeticOperation(this);
    }
}
