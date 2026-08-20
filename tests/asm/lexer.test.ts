import { describe, test } from "node:test";
import { TestDriver } from "./driver.js";

describe("The Lexer should", () => {

    const driver = new TestDriver()


    test("Tokenize should recognize arrays declarations", () => {
        const asm = `
        .data
            my_array  10 20 30 40
        `

        const tokens = driver.tokenize(asm);

        driver.verifyTokens(tokens, [
            { kind: "DataSegment", text: ".data" },
            { kind: "Identifier", text: "my_array" },
            { kind: "NaturalNumber", text: "10" },
            { kind: "NaturalNumber", text: "20" },
            { kind: "NaturalNumber", text: "30" },
            { kind: "NaturalNumber", text: "40" },
        ])
    })

    test("token arithemtic over addresses", () => {
        const asm = `
        .data
        val  10

        .code
        LOAD val+1
        STORE val-1
        
        `
        const tokens = driver.tokenize(asm);

        driver.verifyTokens(tokens, [
            { kind: "DataSegment", text: ".data" },
            { kind: "Identifier", text: "val" },
            { kind: "NaturalNumber", text: "10" },

            { kind: "CodeSegment", text: ".code" },
            { kind: "Mnemonic", text: "LOAD" },
            { kind: "Identifier", text: "val" },
            { kind: "PLUS", text: "+" },
            { kind: "NaturalNumber", text: "1" },
            { kind: "Mnemonic", text: "STORE" },
            { kind: "Identifier", text: "val" },
            { kind: "MINUS", text: "-" },
            { kind: "NaturalNumber", text: "1" },
        ])
    });

    test("tokenize macro segments and labels", () => {
        const asm = `
        .macro INCR param
            LOAD {param}
            ADD 1
            STORE {param}
        .end
        `
        const tokens = driver.tokenize(asm);

        driver.verifyTokens(tokens, [
            { kind: "MacroSegment", text: ".macro" },
            { kind: "Identifier", text: "INCR" },
            { kind: "Identifier", text: "param" },

            { kind: "Mnemonic", text: "LOAD" },
            { kind: "Parameter", text: "{param}" },

            { kind: "Mnemonic", text: "ADD" },
            { kind: "NaturalNumber", text: "1" },

            { kind: "Mnemonic", text: "STORE" },
            { kind: "Parameter", text: "{param}" },

            { kind: "MacroEnd", text: ".end" },
        ])
    })
})