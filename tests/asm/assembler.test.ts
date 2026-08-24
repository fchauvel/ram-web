import { describe, test } from "node:test";
import { TestDriver } from "./driver.js";

describe("Assembler end-to-end", () => {
  const driver = new TestDriver();

  test("simple arithmetic program", () => {
    const source = `
      .data
        val3  3
      .code
        LOAD 5
        ADD val3
        STORE 10
        HALT
    `;

    driver.loadAndRun(source);

    driver.verify({
      running: false,
      acc: 8,
      ip: 27, // HALT is at 26, IP advances to 27
      memory: [
        { address: 0, value: 3 }, // val3
        { address: 10, value: 8 }, // result
      ],
      output: [],
    });
  });

  test("program with comments", () => {
    const source = `
      ; A comment before any section
      .data
        val3  3 ; inline comment after a declaration
      .code
        ; a comment on its own line
        LOAD 5
        ADD val3
        STORE 10
        HALT
    `;

    driver.loadAndRun(source);

    driver.verify({
      running: false,
      acc: 8,
      ip: 27, // HALT is at 26, IP advances to 27
      memory: [
        { address: 0, value: 3 }, // val3
        { address: 10, value: 8 }, // result
      ],
      output: [],
    });
  });

  test("program with variables", () => {
    const source = `
      .data
        value   5
        addend  10
        result  0

      .code
        LOAD    0
        ADD     value
        ADD     addend
        STORE   result
        HALT
    `;

    driver.loadAndRun(source);

    driver.verify({
      running: false,
      acc: 15,
      ip: 29, // HALT is at 28, IP advances to 29
      memory: [
        { address: 0, value: 5 }, // value
        { address: 1, value: 10 }, // addend
        { address: 2, value: 15 }, // result
      ],
      output: [],
    });
  });

  test("program with label", () => {
    const source = `
      .data
        counter 3
        one     1

      .code
        loop: LOAD  0
              ADD   counter
              SUBTRACT   one
              STORE counter
              JUMP_ZERO done
              LOAD   0
              JUMP_ZERO  loop
        done: HALT
    `;

    driver.loadAndRun(source);

    driver.verify({
      running: false,
      acc: 0,
      ip: 35, // HALT is at 34, IP advances to 35
      memory: [
        { address: 0, value: 0 }, // counter
        { address: 1, value: 1 }, // one
      ],
    });
  });

  test("program with READ and PRINT", () => {
    const source = `
      .data
        input1  0
        input2  0
        sum     0

      .code
        READ    input1
        READ    input2
        LOAD    0
        ADD     input1
        ADD     input2
        STORE   sum
        PRINT   sum
        HALT
    `;

    driver.loadAndRun(source, [7, 3]);

    driver.verify({
      running: false,
      acc: 10,
      ip: 35, // HALT is at 34, IP advances to 35
      memory: [
        { address: 0, value: 7 }, // input1
        { address: 1, value: 3 }, // input2
        { address: 2, value: 10 }, // sum
      ],
      output: [10],
    });
  });
});
