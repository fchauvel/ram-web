import { describe, test } from "node:test";
import * as assert from "node:assert/strict";
import { Lexer, MacroTable, Parser, Token } from "../../src/asm.js";

function parse(source: string) {
  const lexer = new Lexer(source);
  const parser = new Parser(new Array<Token>(...lexer.tokenize()));
  return parser.parse();
}

describe("MacroTable", () => {
  test("collects a declared macro by name", () => {
    const program = parse(`
      .macro INCR var
        LOAD  {var}
        ADD   one
        STORE {var}
      .end
    `);

    const macros = MacroTable.collectFrom(program);

    assert.ok(macros.isDefined("INCR"));
    assert.strictEqual(macros.lookup("INCR").name.name, "INCR");
  });

  test("collects several macros declared side by side", () => {
    const program = parse(`
      .macro INCR var
        LOAD  {var}
        ADD   one
        STORE {var}
      .end

      .macro DECR var
        LOAD      {var}
        SUBTRACT  one
        STORE     {var}
      .end
    `);

    const macros = MacroTable.collectFrom(program);

    assert.ok(macros.isDefined("INCR"));
    assert.ok(macros.isDefined("DECR"));
  });

  test("does not know about a macro that was never declared", () => {
    const program = parse(`
      .macro INCR var
        LOAD  {var}
        ADD   one
        STORE {var}
      .end
    `);

    const macros = MacroTable.collectFrom(program);

    assert.strictEqual(macros.isDefined("DECR"), false);
    assert.throws(() => macros.lookup("DECR"), /DECR is not defined/);
  });

  test("rejects two macros declared with the same name", () => {
    const program = parse(`
      .macro INCR var
        LOAD  {var}
        ADD   one
        STORE {var}
      .end

      .macro INCR var
        LOAD  {var}
        ADD   one
        STORE {var}
      .end
    `);

    assert.throws(
      () => MacroTable.collectFrom(program),
      /INCR is already defined/
    );
  });
});
