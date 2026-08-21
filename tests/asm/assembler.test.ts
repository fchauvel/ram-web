import { describe, test } from "node:test";
import { TestDriver } from "./driver.js";

describe("Assembler end-to-end", () => {
  const driver = new TestDriver();

  test("simple arithmetic program", () => {
    const source = `
      .data
        val3  3
      .code
        SET 5
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
        SET 5
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
        LOAD    value
        ADD     addend
        STORE   result
        HALT
    `;

    driver.loadAndRun(source);

    driver.verify({
      running: false,
      acc: 15,
      ip: 27, // HALT is at 26, IP advances to 27
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
        loop: LOAD  counter
              SUBTRACT   one
              STORE counter
              JUMPZ done
              SET   0
              JUMPZ  loop
        done: HALT
    `;

    driver.loadAndRun(source);

    driver.verify({
      running: false,
      acc: 0,
      ip: 33, // HALT is at 32, IP advances to 33
      memory: [
        { address: 0, value: 0 }, // counter
        { address: 1, value: 1 }, // one
      ],
    });
  });

  test("program with PROMPT and PRINT", () => {
    const source = `
      .data
        input1  0
        input2  0
        sum     0

      .code
        PROMPT  input1
        PROMPT  input2
        LOAD    input1
        ADD     input2
        STORE   sum
        PRINT   sum
        HALT
    `;

    driver.loadAndRun(source, [7, 3]);

    driver.verify({
      running: false,
      acc: 10,
      ip: 33, // HALT is at 32, IP advances to 33
      memory: [
        { address: 0, value: 7 }, // input1
        { address: 1, value: 3 }, // input2
        { address: 2, value: 10 }, // sum
      ],
      output: [10],
    });
  });
});
