import { describe, test } from "node:test";
import { TestDriver } from "./driver.js";

describe("Formatter", () => {
  test("formats a single instruction with label and operand", () => {
    const driver = new TestDriver();
    const formatted = driver.formatCodeWithMargin(`
      |.code
      |start: LOAD value
      |       HALT
    `);

    driver.verifyFormattedWithMargin(
      formatted.trimEnd(),
      `
      |.code
      |       start:  LOAD  value
      |               HALT
    `
    );
  });

  test("formats a data segment with declarations", () => {
    const driver = new TestDriver();
    const formatted = driver.formatCodeWithMargin(`
      |.data
      |    vA 0  ; Value of A
      |    valueB  10 ; Value of B
      |
      |.code
      |LOAD valueA  
      |ADD  valueB
      |HALT
    `);

      driver.verifyFormattedWithMargin(
      formatted.trimEnd(),
      `
      |.data
      |       vA      0   ; Value of A
      |       valueB  10  ; Value of B
      |
      |.code
      |         LOAD  valueA
      |         ADD   valueB
      |         HALT
    `
    );
  });

  describe("comments", () => {
    test("keeps leading comments before segments", () => {
      const driver = new TestDriver();
      const formatted = driver.formatCodeWithMargin(`
        |; This is the data segment
        |.data
        |value  42
        |
        |; This is the code segment
        |.code
        |LOAD value
        |HALT
      `);

      driver.verifyFormattedWithMargin(
        formatted.trimEnd(),
        `
        |; This is the data segment
        |.data
        |       value  42
        |
        |; This is the code segment
        |.code
        |         LOAD  value
        |         HALT
      `
      );
    });


    test("keeps inline comments after instructions", () => {
      const driver = new TestDriver();
      const formatted = driver.formatCodeWithMargin(`
        |.code
        |LOAD vA ; first load
        |ADD  valueB ; add second
        |HALT             ; stop
      `);

    driver.verifyFormattedWithMargin(
      formatted.trimEnd(),
      `
        |.code
        |         LOAD  vA      ; first load
        |         ADD   valueB  ; add second
        |         HALT          ; stop
      `
      );
    });

    test("keeps comments between instructions", () => {
      const driver = new TestDriver();
      const formatted = driver.formatCodeWithMargin(`
        |.code
        |LOAD valueA
        |; mid
        |ADD valueB
        |HALT
      `);

      driver.verifyFormattedWithMargin(
        formatted.trimEnd(),
        `
        |.code
        |         LOAD  valueA
        |         ; mid
        |         ADD   valueB
        |         HALT
      `
      );
    });
  });
});
