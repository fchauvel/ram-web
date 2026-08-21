import {
  Action,
  AstVisitor,
  CodeSegment,
  Expression,
  Identifier,
  Instruction,
  Label,
  MacroCall,
  MacroDeclaration,
  ParameterReference,
  Program,
  Section,
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

export function expandMacroCalls(program: Program): Program {
  const macros = MacroTable.collectFrom(program);
  const nextCallSiteId = makeCallSiteIdGenerator();
  const sections = program.sections.map((section) =>
    expandSection(section, macros, nextCallSiteId)
  );
  return new Program(sections, program.span);
}

function makeCallSiteIdGenerator(): () => number {
  let nextId = 1;
  return () => nextId++;
}

function expandSection(
  section: Section,
  macros: MacroTable,
  nextCallSiteId: () => number
): Section {
  if (!(section instanceof CodeSegment)) {
    return section;
  }
  const actions = section.actions.flatMap((action) =>
    expandCall(action, macros, nextCallSiteId)
  );
  return new CodeSegment(actions, section.span);
}

function expandCall(
  action: Action,
  macros: MacroTable,
  nextCallSiteId: () => number
): Array<Action> {
  if (!(action instanceof MacroCall)) {
    return [action];
  }
  if (action.label != undefined) {
    throw new Error("A label on a macro call is not supported yet");
  }
  const macro = macros.lookup(action.name.name);
  const instructions = expand(macro, action.args);
  return makeLabelsHygienic(instructions, nextCallSiteId());
}

// Renames every label defined inside one macro expansion (and every
// reference to it within that same expansion) so repeated calls to the
// same macro never collide in the symbol table.
function makeLabelsHygienic(
  instructions: Array<Instruction>,
  callSiteId: number
): Array<Instruction> {
  const suffix = `$${callSiteId}`;
  const localLabels = collectLabelNames(instructions);
  return instructions.map((instruction) =>
    renameLocalLabels(instruction, localLabels, suffix)
  );
}

function collectLabelNames(instructions: Array<Instruction>): Set<string> {
  const names = new Set<string>();
  for (const instruction of instructions) {
    if (instruction.label != undefined) {
      names.add(instruction.label.name);
    }
  }
  return names;
}

function renameLocalLabels(
  instruction: Instruction,
  localLabels: Set<string>,
  suffix: string
): Instruction {
  const label = renameLabel(instruction.label, suffix);
  const operand = renameOperandIfLocalLabel(instruction.operand, localLabels, suffix);
  return new Instruction(instruction.mnemonic, operand, label, instruction.span);
}

function renameLabel(label: Label | undefined, suffix: string): Label | undefined {
  if (label == undefined) {
    return undefined;
  }
  return new Label(label.name + suffix, label.span);
}

function renameOperandIfLocalLabel(
  operand: Expression | undefined,
  localLabels: Set<string>,
  suffix: string
): Expression | undefined {
  if (operand == undefined || !(operand instanceof Identifier) || !localLabels.has(operand.name)) {
    return operand;
  }
  return new Identifier(operand.name + suffix, operand.span);
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
