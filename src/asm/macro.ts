import {
  Action,
  AstVisitor,
  Expression,
  Identifier,
  Instruction,
  MacroDeclaration,
  ParameterReference,
  Program,
} from "./ast.js";

export class MacroTable {
  readonly #macros: Map<string, MacroDeclaration>;

  constructor() {
    this.#macros = new Map<string, MacroDeclaration>();
  }

  static collectFrom(program: Program): MacroTable {
    const table = new MacroTable();
    program.accept(new MacroCollector(table));
    return table;
  }

  define(macro: MacroDeclaration): void {
    const name = macro.name.name;
    if (this.#macros.has(name)) {
      throw new Error(`Macro ${name} is already defined`);
    }
    this.#macros.set(name, macro);
  }

  isDefined(name: string): boolean {
    return this.#macros.has(name);
  }

  lookup(name: string): MacroDeclaration {
    const macro = this.#macros.get(name);
    if (macro == undefined) {
      throw new Error(`Macro ${name} is not defined`);
    }
    return macro;
  }
}

export function expand(macro: MacroDeclaration, args: Array<Expression>): Array<Instruction> {
  const bindings = bindParametersToArguments(macro.parameters, args);
  return macro.body.map((action) => substituteParameters(asInstruction(action), bindings));
}

function asInstruction(action: Action): Instruction {
  if (!(action instanceof Instruction)) {
    throw new Error("A macro body can only contain instructions");
  }
  return action;
}

function bindParametersToArguments(
  parameters: Array<Identifier>,
  args: Array<Expression>
): Map<string, Expression> {
  const bindings = new Map<string, Expression>();
  parameters.forEach((parameter, index) => {
    bindings.set(parameter.name, args[index]);
  });
  return bindings;
}

function substituteParameters(
  instruction: Instruction,
  bindings: Map<string, Expression>
): Instruction {
  const operand = resolveOperand(instruction.operand, bindings);
  return new Instruction(instruction.mnemonic, operand, instruction.label, instruction.span);
}

function resolveOperand(
  operand: Expression | undefined,
  bindings: Map<string, Expression>
): Expression | undefined {
  if (operand == undefined || !(operand instanceof ParameterReference)) {
    return operand;
  }
  const argument = bindings.get(operand.parameterName);
  if (argument == undefined) {
    throw new Error(`Macro parameter ${operand.parameterName} has no matching argument`);
  }
  return argument;
}

class MacroCollector extends AstVisitor {
  readonly #table: MacroTable;

  constructor(table: MacroTable) {
    super();
    this.#table = table;
  }

  override visitProgram(node: Program): void {
    for (const section of node.sections) {
      section.accept(this);
    }
  }

  override visitMacroDeclaration(node: MacroDeclaration): void {
    this.#table.define(node);
  }
}
