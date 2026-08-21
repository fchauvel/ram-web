import {
  ArithmeticOperation,
  AstNode,
  AstVisitor,
  CodeSegment,
  DataSegment,
  DataDeclaration,
  Identifier,
  Instruction,
  Label,
  MacroDeclaration,
  MacroCall,
  Mnemonic,
  NumberLiteral,
  ParameterReference,
  Program,
  ArithmeticOperator,
} from "./ast.js";
import { Lexer, TextPosition, Token, TokenKind, TokenStream } from "./lexer.js";
import { Parser } from "./parser.js";

type FormatOptions = {
  columnSpacing?: number;
};

const DEFAULT_OPTIONS: Required<FormatOptions> = {
  columnSpacing: 2,
};

export function formatSource(
  source: string,
  options: FormatOptions = {}
): string {
  const formatter = new Formatter(options);
  return formatter.formatSource(source);
}

class Formatter {
  readonly #opts: Required<FormatOptions>;

  constructor(opts: FormatOptions = {}) {
    this.#opts = { ...DEFAULT_OPTIONS, ...opts };
  }

  formatSource(source: string): string {
    const lexer = new Lexer(source);
    const tokens = Array.from(lexer.tokenize()) as Array<Token>;
    const parserTokens = tokens.filter(
      (t) =>
        !t.kind.equals(TokenKind.Comment) &&
        !t.kind.equals(TokenKind.WhiteSpace)
    );
    const parser = new Parser(parserTokens);
    const program = parser.parse();
    const stream = new TokenStream(tokens, [TokenKind.WhiteSpace]);
    return this.formatProgram(program, stream);
  }

  formatProgram(program: Program, stream: TokenStream): string {
    const builder = new AstTableBuilder(this.#opts, stream);
    program.accept(builder);
    return this.#render(builder.document);
  }

  #render(document: Document): string {
    const columnGap = " ".repeat(this.#opts.columnSpacing);
    const lines = new Array<string>();
    for (const table of document.tables) {
      for (const row of table.rows) {
        const line = new Array<string>();
        for (const [columnIndex, cell] of row.entries()) {
          const formattedText = cell.render(
            table.columns[columnIndex].maxWidth
          );
          line.push(formattedText);
        }
        lines.push(line.join(columnGap));
      }
    }
    return lines.join("\n");
  }
}

class Document {
  readonly tables: Table[];

  constructor() {
    this.tables = [];
  }

  pushTable() {
    const table = new Table();
    this.tables.push(table);
  }

  get table(): Table {
    const table = this.tables.at(-1);
    if (table == undefined) {
      throw new Error("Invalid state: No table");
    }
    return table;
  }
}

class Table {
  columns: ColumnMeta[] = [];
  rows: Cell[][] = [];

  get #currentRow(): Cell[] {
    const row = this.rows.at(-1);
    if (row == undefined) throw new Error("No current row");
    return row;
  }

  newRow() {
    this.rows.push([]);
  }

  setCell(text: string, column: number, options: CellStyle = {}) {
    const { align = CellAlign.Left, padding = " ", spanColumns = 1 } = options;
    this.#requireNewCell(column);
    this.#ensureCellsUpTo(column);
    this.#currentRow[column] = new Cell(text, spanColumns, align, padding);
    this.#adjustColumnWidth(column, text.length, options);
    this.#ensureAllColumnsDefined();
  }

  #requireNewCell(column: number) {
    if (this.#currentRow[column] != undefined) {
      throw new Error(
        `Invalid state: Cell already contains '${
          this.#currentRow[column].text
        }'`
      );
    }
  }

  #ensureCellsUpTo(column: number) {
    for (let i = 0; i <= column; i++) {
      if (this.#currentRow[i] == undefined) {
        this.#currentRow[i] = new Cell("");
      }
      if (this.columns[i] == undefined) {
        this.columns[i] = { maxWidth: 0 };
      }
    }
  }

  #adjustColumnWidth(column: number, width: number, options: CellStyle) {
    const { affectsColumnWidth = true } = options;
    if (affectsColumnWidth) {
      const columnInfo = this.columns[column];
      columnInfo.maxWidth = Math.max(columnInfo.maxWidth, width);
    }
  }

  #ensureAllColumnsDefined() {
    for (const [index, cell] of this.#currentRow.entries()) {
      if (this.columns[index] == undefined)
        throw new Error("Column not defined");
    }
  }

  pushCellAfter(text: string, column: number, options: CellStyle) {
    this.setCell(text, Math.max(column, this.#currentRow.length), options);
  }
}

type ColumnMeta = { maxWidth: number };

class Cell {
  constructor(
    readonly text: string,
    readonly spanColumns = 1,
    readonly align: CellAlign = CellAlign.Left,
    readonly padding = " "
  ) {}

  render(width: number): string {
    switch (this.align) {
      case CellAlign.None:
        return this.text;
      case CellAlign.Left:
        return this.text.padEnd(width, this.padding);
      case CellAlign.Right:
        return this.text.padStart(width, this.padding);
    }
  }
}

enum CellAlign {
  Left,
  Right,
  None,
}

type CellStyle = {
  align?: CellAlign;
  padding?: string;
  spanColumns?: number;
  // False for comments, so a long comment never stretches a column's width.
  affectsColumnWidth?: boolean;
};

class AstTableBuilder extends AstVisitor {
  readonly document = new Document();
  readonly opts: Required<FormatOptions>;
  readonly tokens: TokenStream;

  readonly #printer: Printer;

  constructor(opts: Required<FormatOptions>, stream: TokenStream) {
    super();
    this.opts = opts;
    this.tokens = stream;
    this.#printer = new Printer();
  }

  override visitProgram(node: Program): void {
    for (const section of node.sections) {
      section.accept(this);
    }
  }

  override visitDataSegment(node: DataSegment): void {
    this.document.pushTable();
    this.document.table.newRow();
    this.#formatLeadingComments(node.span.start, 0);
    this.tokens.advanceUntil(node.span.start);
    this.document.table.setCell(".data", 0, { align: CellAlign.None });
    for (const dataDeclaration of node.declarations) {
      dataDeclaration.accept(this);
    }
    this.document.table.newRow();
  }

  override visitDataDeclaration(node: DataDeclaration): void {
    this.#formatLeadingComments(node.span.start, 1);
    this.document.table.newRow();
    this.document.table.setCell(
      this.#printer.print(node.identifier),
      1,
      { align: CellAlign.Left }
    );
    for (const value of node.initialValues) {
      this.document.table.pushCellAfter(
        this.#printer.print(value),
        2,
        { align: CellAlign.Left }
      );
    }
    this.tokens.advanceUntil(node.span.end);
    this.#formatInlineComment(node.span.end, 1);
    this.#formatTrailingComments(1);
  }

  override visitCodeSegment(node: CodeSegment): void {
    this.document.pushTable();
    this.document.table.newRow();
    this.#formatLeadingComments(node.span.start, 0);
    this.tokens.advanceUntil(node.span.start);
    this.document.table.setCell(".code", 0, { align: CellAlign.None });
    this.document.table.newRow();
    for (const action of node.actions) {
      action.accept(this);
    }
    this.document.table.newRow();
    this.#formatTrailingComments(0);
  }

  override visitInstruction(node: Instruction): void {
    this.#formatLeadingComments(node.span.start, 2);
    if (node.label != undefined) {
      this.document.table.setCell(
        this.#printer.print(node.label),
        1,
        { align: CellAlign.Right }
      );
    }
    this.document.table.pushCellAfter(
      this.#printer.print(node.mnemonic),
      2,
      { align: CellAlign.Left }
    );
    if (node.operand != undefined) {
      const operandText = this.#printer.print(node.operand);
      this.document.table.pushCellAfter(operandText, 3, { align: CellAlign.Left });
    }
    this.tokens.advanceUntil(node.span.end);
    // Column 4 so a comment lines up even on a row with no operand (column 3).
    this.#formatInlineComment(node.span.end, 4);
    this.document.table.newRow();
    this.#formatTrailingComments(2);
  }

  override visitMacroCall(node: MacroCall): void {
    this.#formatLeadingComments(node.span.start, 2);
    if (node.label != undefined) {
      this.document.table.setCell(
        this.#printer.print(node.label),
        1,
        { align: CellAlign.Left }
      );
    }
    this.document.table.pushCellAfter(
      this.#printer.print(node.name),
      2,
      { align: CellAlign.Left }
    );
    for (const arg of node.args) {
      const argText = this.#printer.print(arg);
      this.document.table.pushCellAfter(argText, 3, { align: CellAlign.Left });
    }
    this.tokens.advanceUntil(node.span.end);
    this.#formatInlineComment(node.span.end, 4);
    this.document.table.newRow();
    this.#formatTrailingComments(2);
  }

  override visitMacroDeclaration(node: MacroDeclaration): void {
    this.document.pushTable();
    this.document.table.newRow();
    this.#formatLeadingComments(node.span.start, 0);
    this.tokens.advanceUntil(node.span.start);
    this.document.table.setCell(".macro", 0, { align: CellAlign.None });
    this.document.table.pushCellAfter(node.name.name, 1, { align: CellAlign.None });
    for (const param of node.parameters) {
      this.document.table.pushCellAfter(param.name, 2, { align: CellAlign.None });
    }
    this.document.table.newRow();
    for (const action of node.body) {
      action.accept(this);
    }
    this.tokens.advanceUntil(node.span.end);
    this.document.table.setCell(".end", 0, { align: CellAlign.None } );
    this.#formatInlineComment(node.span.end,0);
    this.#formatTrailingComments(0);
    this.document.table.newRow();
  }

  #formatLeadingComments(position: TextPosition, column: number): void {
    const leading = this.tokens.takeLeadingComments(position);
    for (const comment of leading) {
      this.document.table.pushCellAfter(comment.text, column, {
        align: CellAlign.None,
        affectsColumnWidth: false,
      });
      this.document.table.newRow();
    }
  }

  #formatInlineComment(position: TextPosition, column: number): void {
    const inline = this.tokens.takeInlineComment(position);
    if (inline != undefined) {
      this.document.table.pushCellAfter(inline.text, column, {
        align: CellAlign.None,
        affectsColumnWidth: false,
      });
    }
  }

  #formatTrailingComments(column: number): void {
    const comments = this.tokens.takeIfFollowedByBlankLine();
    for (const comment of comments) {
      this.document.table.setCell(comment.text, column, {
        align: CellAlign.None,
        affectsColumnWidth: false,
      });
      this.document.table.newRow();
    }
  }
}

type Placement = {
  segment: CellStyle;
  identifier: CellStyle;
  numberLiteral: CellStyle;
  label: CellStyle;
  mnemonic: CellStyle;
  inlineComment: CellStyle;
  leadingComment: CellStyle;
  trailingComment: CellStyle;
};

class Printer extends AstVisitor {
  #result: string = "";

  print(node: AstNode): string {
    this.#result = "";
    node.accept(this);
    return this.#result;
  }

  visitArithmeticOperation(node: ArithmeticOperation): void {
    node.left.accept(this);
    if (node.operator == ArithmeticOperator.PLUS) {
      this.#result += "+";
    } else if (node.operator == ArithmeticOperator.MINUS) {
      this.#result += "-";
    } else {
      throw new Error(`Unknown arithmetic operator: ${node.operator}`);
    }
    node.right.accept(this);
  }

  visitIdentifier(node: Identifier): void {
    this.#result += node.name;
  }

  visitNumberLiteral(node: NumberLiteral): void {
    this.#result += node.value.toString();
  }

  visitLabel(node: Label): void {
    this.#result += node.name + ":";
  }

  visitMnemonic(node: Mnemonic): void {
    this.#result += node.name.toUpperCase();
  }

  visitParameterReference(node: ParameterReference): void {
    this.#result += `{${node.parameterName}}`;
  }
}
