import { describe, test } from "node:test";
import * as assert from "node:assert/strict";
import { Identifier, Lexer, MacroTable, Parser, Token, expand } from "../../src/asm.js";

function parse(source: string) {
  const lexer = new Lexer(source);
  const parser = new Parser(new Array<Token>(...lexer.tokenize()));
  return parser.parse();
}

function declareMacro(source: string, name: string) {
  const program = parse(source);
  return MacroTable.collectFrom(program).lookup(name);
}

describe("expand", () => {
  test("substitutes a macro parameter with the call-site argument", () => {
    const macro = declareMacro(
      `
      .macro INCR var
        LOAD  0
        ADD   {var}
        ADD   one
        STORE {var}
      .end
    `,
      "INCR"
    );

    const instructions = expand(macro, [new Identifier("x")]);

    assert.strictEqual(instructions.length, 4);
    assert.strictEqual(instructions[0].mnemonic.name, "LOAD");
    assert.strictEqual(instructions[1].mnemonic.name, "ADD");
    assert.strictEqual((instructions[1].operand as Identifier).name, "x");
    assert.strictEqual(instructions[2].mnemonic.name, "ADD");
    assert.strictEqual((instructions[2].operand as Identifier).name, "one");
    assert.strictEqual(instructions[3].mnemonic.name, "STORE");
    assert.strictEqual((instructions[3].operand as Identifier).name, "x");
  });

  test("substitutes each parameter with its own argument", () => {
    const macro = declareMacro(
      `
      .macro COPY source target
        LOAD  0
        ADD   {source}
        STORE {target}
      .end
    `,
      "COPY"
    );

    const instructions = expand(macro, [new Identifier("a"), new Identifier("b")]);

    assert.strictEqual((instructions[1].operand as Identifier).name, "a");
    assert.strictEqual((instructions[2].operand as Identifier).name, "b");
  });

  test("leaves instructions without a macro parameter unchanged", () => {
    const macro = declareMacro(
      `
      .macro RESET
        LOAD  0
        STORE result
      .end
    `,
      "RESET"
    );

    const instructions = expand(macro, []);

    assert.strictEqual(instructions.length, 2);
    assert.strictEqual((instructions[1].operand as Identifier).name, "result");
  });

  test("rejects a call with too few arguments", () => {
    const macro = declareMacro(
      `
      .macro INCR var
        LOAD  0
        ADD   {var}
        ADD   one
        STORE {var}
      .end
    `,
      "INCR"
    );

    assert.throws(() => expand(macro, []), /var/);
  });
});
