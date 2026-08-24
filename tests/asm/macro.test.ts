import { describe, test } from "node:test";
import { TestDriver } from "./driver.js";

// These tests specify the intended behaviour of macro expansion. They are
// expected to fail until the assembler (VariableCollector/CodeGenerator in
// src/asm/assembler.ts) actually expands MacroCall/MacroDeclaration nodes.
describe("Macro expansion", () => {
  const driver = new TestDriver();

  test("a macro call expands to its body", () => {
    const source = `
      .data
        one  1
        x    5

      .macro INCR var
        LOAD  0
        ADD   {var}
        ADD   one
        STORE {var}
      .end

      .code
        INCR x
        HALT
    `;

    driver.loadAndRun(source);

    driver.verify({
      running: false,
      acc: 6,
      ip: 29, // HALT is at 28 (4 expanded instructions x 2 words), IP advances to 29
      memory: [
        { address: 0, value: 1 }, // one
        { address: 1, value: 6 }, // x, incremented once
      ],
    });
  });

  test("calling a macro twice expands it twice, with correct addresses", () => {
    const source = `
      .data
        one  1
        x    5

      .macro INCR var
        LOAD  0
        ADD   {var}
        ADD   one
        STORE {var}
      .end

      .code
        INCR x
        INCR x
        HALT
    `;

    driver.loadAndRun(source);

    driver.verify({
      running: false,
      acc: 7,
      ip: 37, // HALT is at 36 (8 expanded instructions x 2 words), IP advances to 37
      memory: [
        { address: 0, value: 1 }, // one
        { address: 1, value: 7 }, // x, incremented twice
      ],
    });
  });

  test("labels inside a macro body are hygienic across call sites", () => {
    // Same DECRTOZERO body, invoked twice: if the loop/done labels were not
    // rescoped per call site, the second call would collide with the first
    // in the symbol table (or, worse, jump into the first expansion).
    const source = `
      .data
        one  1
        a    2
        b    1

      .macro DECRTOZERO var
        loop: LOAD       0
              ADD         {var}
              SUBTRACT    one
              STORE       {var}
              JUMP_ZERO   done
              LOAD        0
              JUMP_ZERO   loop
        done: LOAD        0
      .end

      .code
        DECRTOZERO a
        DECRTOZERO b
        HALT
    `;

    driver.loadAndRun(source);

    driver.verify({
      running: false,
      acc: 0,
      ip: 53, // HALT is at 52 (16 expanded instructions x 2 words, 8 per call), IP advances to 53
      memory: [
        { address: 0, value: 1 }, // one
        { address: 1, value: 0 }, // a, decremented to 0
        { address: 2, value: 0 }, // b, decremented to 0
      ],
    });
  });
});
