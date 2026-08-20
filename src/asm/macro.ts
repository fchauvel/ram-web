import { AstVisitor, MacroDeclaration, Program } from "./ast.js";

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
