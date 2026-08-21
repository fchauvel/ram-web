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

  test("gives each call site its own copy of a label defined in the macro body", () => {
    const program = parse(`
      .macro DECRTOZERO var
        loop: LOAD      {var}
              SUBTRACT  one
              STORE     {var}
              JUMPZ     done
              SET       0
              JUMPZ     loop
        done: SET       0
      .end

      .code
        DECRTOZERO a
        DECRTOZERO b
        HALT
    `);

    const expanded = expandMacroCalls(program);

    const codeSegment = expanded.sections.find(
      (section) => section instanceof CodeSegment
    ) as CodeSegment;
    const labels = codeSegment.actions
      .map((action: any) => action.label?.name)
      .filter((name) => name != undefined);

    assert.strictEqual(labels.length, 4, "each call site defines its own loop and done label");
    assert.strictEqual(new Set(labels).size, 4, "labels must not collide across call sites");

    const jumpTargets = codeSegment.actions
      .filter((action: any) => action.mnemonic?.name === "JUMPZ")
      .map((action: any) => action.operand.name);
    for (const target of jumpTargets) {
      assert.ok(labels.includes(target), `JUMPZ target ${target} must match a label from the same call site`);
    }
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
