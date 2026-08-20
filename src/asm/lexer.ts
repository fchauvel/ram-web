import { AstVisitor, DataSegment, DataDeclaration, Program } from "./ast.js";

export class TokenKind {
  static readonly Mnemonic = new TokenKind(
    "Mnemonic",
    /^(ADD|SUBTRACT|JUMPZ|SET|PROMPT|PRINT|LOAD|STORE|HALT)\b/
  );
  static readonly CodeSegment = new TokenKind("CodeSegment", /^\.code/);
  static readonly DataSegment = new TokenKind("DataSegment", /^\.data/);
  static readonly MacroSegment = new TokenKind("MacroSegment", /^\.macro/);
  static readonly MacroEnd = new TokenKind("MacroEnd", /^\.end/);
  static readonly Label = new TokenKind("Label", /^[a-zA-Z_][a-zA-Z0-9_]*:/);
  static readonly Parameter = new TokenKind("Parameter", /^\{[a-zA-Z_][a-zA-Z0-9_]*\}/);
  static readonly Identifier = new TokenKind(
    "Identifier",
    /^[a-zA-Z_][a-zA-Z0-9_]*/
  );
  static readonly NaturalNumber = new TokenKind("NaturalNumber", /^[0-9]+/);
  static readonly Comment = new TokenKind("Comment", /^;[^\n]*/);
  static readonly WhiteSpace = new TokenKind("WhiteSpace", /^\s+/, true);
  static readonly PLUS = new TokenKind("PLUS", /^\+/);
  static readonly MINUS = new TokenKind("MINUS", /^-/);
  static readonly COMMA = new TokenKind("COMMA", /^,/);

  static all = [
    TokenKind.Comment,
    TokenKind.Mnemonic,
    TokenKind.WhiteSpace,
    TokenKind.NaturalNumber,
    TokenKind.CodeSegment,
    TokenKind.DataSegment,
    TokenKind.MacroSegment,
    TokenKind.MacroEnd,
    TokenKind.Label,
    TokenKind.Parameter,
    TokenKind.Identifier,
    TokenKind.PLUS,
    TokenKind.MINUS,
    TokenKind.COMMA,
  ];

  private constructor(
    readonly name: string,
    readonly pattern: RegExp,
    readonly isIgnored: boolean = false
  ) {}

  equals(other: TokenKind): boolean {
    return this.name == other.name;
  }
}

export class Token {
  constructor(
    readonly kind: TokenKind,
    readonly text: string,
    readonly span: TextSpan
  ) {
    if (text.length == 0) {
      throw new Error("Token value cannot be empty");
    }
  }

  get includesBlankLines(): boolean {
    return /\n[ \t]*\n/.test(this.text);
  }
}

export class Lexer {
  private position: TextPosition = new TextPosition(1, 1, 0);

  constructor(private source: string) {}

  *tokenize(): Iterable<Token> {
    while (this.source.length > 0) {
      const next = this.nextToken();
      if (next == undefined) {
        if (this.source.length > 0) {
          throw new Error(`Unexpected token at: ${this.source}`);
        }
        break;
      }
      yield next;
    }
  }

  nextToken(): Token | undefined {
    while (this.source.length > 0) {
      let tokenKinds = [...TokenKind.all];
      while (tokenKinds.length > 0) {
        const kind = tokenKinds.shift();
        if (kind == undefined) break;
        const token = this.tryConsume(kind);
        if (token != undefined) {
          if (kind.isIgnored) {
            tokenKinds = [...TokenKind.all];
          } else {
            return token;
          }
        }
      }
      if (this.source.length > 0) {
        return undefined;
      }
    }
    return undefined;
  }

  tryConsume(kind: TokenKind): Token | undefined {
    const match = this.source.match(kind.pattern);
    if (match != undefined) {
      const prefix = match[0];
      const start = this.position;
      this.position = this.position.advancedBy(prefix);
      this.source = this.source.slice(prefix.length);
      return new Token(kind, prefix, new TextSpan(start, this.position));
    }
    return undefined;
  }
}

export class TokenStream {
  #position = 0;
  readonly #ignored: Set<TokenKind>;

  constructor(
    readonly tokens: ReadonlyArray<Token>,
    ignored: Iterable<TokenKind> = []
  ) {
    this.#ignored = new Set(ignored);
  }

  skip(kind: TokenKind): void {
    this.#ignored.add(kind);
  }

  keep(kind: TokenKind): void {
    this.#ignored.delete(kind);
  }

  /**
   * Consume and return all comments (and any ignored tokens) whose start
   * position precedes the given position. Stops when encountering a non-comment
   * token or a blank line before the given position.
   */
  takeLeadingComments(before: TextPosition): Token[] {
    const result: Token[] = [];
    while (this.hasNext()) {
      const next = this.peek()!;
      if (!next.span.start.precedes(before)) break;
      if (next.kind.equals(TokenKind.Comment)) {
        result.push(this.next()!);
        continue;
      }
      if (next.kind.equals(TokenKind.WhiteSpace)) {
        // Detect blank line in whitespace chunk
        const hasBlank = /\n[ \t]*\n/.test(next.text);
        if (hasBlank) {
          // consume it and stop; blank line breaks leading sequence
          this.next();
          break;
        }
        this.next();
        continue;
      }
      break;
    }
    return result;
  }

  /**
   * Consume and return a comment that starts on the same line as the given
   * position. Returns undefined if the next token is not such a comment.
   */
  takeInlineComment(at: TextPosition): Token | undefined {
    if (!this.hasNext()) return undefined;
    const next = this.peek()!;
    if (next.kind.equals(TokenKind.Comment) && next.span.start.sameLine(at)) {
      return this.next();
    }
    return undefined;
  }

  /**
   * Consume trailing comments/whitespace up to (but not including) the next
   * blank line or non-comment token. Stops before the blank line so those
   * comments can be treated as leading for the following node.
   */
  takeIfFollowedByBlankLine(): Token[] {
    const comments: Token[] = [];
    // Look ahead without consuming to see if there is a blank line before the
    // next non-comment token. If not, do not consume anything.
    let idx = this.#position;
    let foundBlank = false;
    while (idx < this.tokens.length) {
      const next = this.tokens[idx];
      if (next.kind.equals(TokenKind.Comment)) {
        idx++;
        continue;
      }
      if (next.kind.equals(TokenKind.WhiteSpace)) {
        if (next.includesBlankLines) {
          foundBlank = true;
          break;
        }
        idx++;
        continue;
      }
      // non-comment/non-whitespace
      break;
    }

    if (!foundBlank) {
      return comments; // nothing consumed
    }

    // Consume up to (but not including) the blank line token we found.
    while (this.#position < idx) {
      const tok = this.tokens[this.#position];
      if (tok.kind.equals(TokenKind.Comment)) {
        comments.push(tok);
      }
      this.#position++;
    }
    return comments;
  }

  hasNext(expected?: TokenKind): boolean {
    this.#advance();
    if (this.#position >= this.tokens.length) return false;
    if (expected == undefined) return true;
    return this.tokens[this.#position].kind.equals(expected);
  }

  peek(offset = 0): Token | undefined {
    this.#advance();
    const idx = this.#position + offset;
    return idx < this.tokens.length ? this.tokens[idx] : undefined;
  }

  next(expected?: TokenKind): Token | undefined {
    this.#advance();
    if (this.#position >= this.tokens.length) return undefined;
    const tok = this.tokens[this.#position];
    if (expected && !tok.kind.equals(expected)) {
      return undefined;
    }
    this.#position++;
    return tok;
  }

  advanceUntil(position: TextPosition): void {
    while (this.#position < this.tokens.length) {
      const token = this.tokens[this.#position];
      if (token.span.start.isBeforeOrSame(position)) {
        this.#position++;
        continue;
      }
      break;
    }
  }

  #advance(): void {
    while (this.#position < this.tokens.length) {
      const token = this.tokens[this.#position];
      if (this.#ignored.has(token.kind) || token.kind.isIgnored) {
        this.#position++;
        continue;
      }
      break;
    }
  }
}

export class TextSpan {
  constructor(readonly start: TextPosition, readonly end: TextPosition) {
    if (end.absolute < start.absolute) {
      throw new Error("End position must not be before start position");
    }
  }

  join(other: TextSpan): TextSpan {
    const start = TextPosition.minimum(this.start, other.start);
    const end = TextPosition.maximum(this.end, other.end);
    return new TextSpan(start, end);
  }

  static empty(): TextSpan {
    const pos = new TextPosition(1, 1, 0);
    return new TextSpan(pos, pos);
  }
}

export class TextPosition {
  constructor(
    readonly line: number,
    readonly column: number,
    readonly absolute: number
  ) {
    if (line < 1) {
      throw new Error("Line number must be greater than zero");
    }
    if (column < 1) {
      throw new Error("Column number must be greater than zero");
    }
    if (absolute < 0) {
      throw new Error("Absolute position cannot be negative");
    }
  }

  advancedBy(string: string): TextPosition {
    let line = this.line;
    let column = this.column;
    let absolute = this.absolute;
    for (const char of string) {
      absolute++;
      if (char === "\n") {
        line++;
        column = 1;
      } else {
        column++;
      }
    }
    return new TextPosition(line, column, absolute);
  }

  precedes(other: TextPosition): boolean {
    return this.absolute < other.absolute;
  }

  isBeforeOrSame(other: TextPosition): boolean {
    return this.absolute <= other.absolute;
  }

  static minimum(...positions: Array<TextPosition>): TextPosition {
    if (positions.length == 0) {
      throw new Error("Invalid argument: Cannot compute minimum of empty position set");
    }
    return positions.reduce((min, p) =>
      p.precedes(min) ? p : min
    );
  }

  static maximum(...positions: Array<TextPosition>): TextPosition {
    if (positions.length == 0) {
      throw new Error("Invalid Argument: Cannot compute maximum of empty position set");
    }
    return positions.reduce((max, p) =>
      max.precedes(p) ? p : max
    );
  }
  sameLine(other: TextPosition): boolean {
    return this.line == other.line;
  }
}
