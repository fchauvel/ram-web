export * from "./asm/ast.js";
export * from "./asm/lexer.js";
export * from "./asm/parser.js";
export * from "./asm/assembler.js";
export * from "./asm/formatter.js";

import { Assembly, Assembler, SymbolTable } from "./asm/assembler.js";
import { AstNode } from "./asm/ast.js";
import { Parser } from "./asm/parser.js";
import { Lexer, TextPosition, TextSpan, Token, TokenKind } from "./asm/lexer.js";
import { formatSource } from "./asm/formatter.js";

export const ASM = {
  Assembly,
  Assembler,
  SymbolTable,
  AstNode,
  Parser,
  TokenKind,
  Token,
  Lexer,
  TextSpan,
  TextPosition,
  formatSource,
};
