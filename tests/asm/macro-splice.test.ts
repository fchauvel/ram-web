import { describe, test } from "node:test";
import * as assert from "node:assert/strict";
import { CodeSegment, Lexer, Parser, Token, expandMacroCalls } from "../../src/asm.js";

function parse(source: string) {
  const lexer = new Lexer(source);
  const parser = new Parser(new Array<Token>(...lexer.tokenize()));
  return parser.parse();
}

describe("expandMacroCalls", () => {
  test("replaces a macro call with its expanded instructions", () => {
    const program = parse(`
      .macro INCR var
        LOAD  {var}
        ADD   one
        STORE {var}
      .end

      .code
        INCR x
        HALT
    `);

    const expanded = expandMacroCalls(program);

    const codeSegment = expanded.sections.find(
      (section) => section instanceof CodeSegment
    ) as CodeSegment;
    assert.deepStrictEqual(
      codeSegment.actions.map((action) => action.constructor.name),
      ["Instruction", "Instruction", "Instruction", "Instruction"]
    );
    assert.deepStrictEqual(
      codeSegment.actions.map((action: any) => action.mnemonic.name),
      ["LOAD", "ADD", "STORE", "HALT"]
    );
  });

  test("rejects a label attached to a macro call", () => {
    const program = parse(`
      .macro INCR var
        LOAD  {var}
        ADD   one
        STORE {var}
      .end

      .code
        start: INCR x
        HALT
    `);

    assert.throws(() => expandMacroCalls(program), /label on a macro call/);
  });
});
