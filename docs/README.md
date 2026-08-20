# Random Access Machine Simulator

A minimal, self-contained educational tool for demonstrating RAM machine concepts.

## Files

- `ram.ts` - TypeScript source code (the RAM machine model)
- `ram.js` - Compiled JavaScript (auto-generated)
- `asm.ts` - TypeScript source code (the assembler)
- `asm.js` - Compiled JavaScript (auto-generated)
- `index.html` - Interactive web interface
- `examples/*.asm` - Example assembly programs
- `tsconfig.json` - TypeScript compiler configuration

## Usage

### Running the Simulator

**Important**: Because the simulator uses ES6 modules, you need to serve it through a local web server (not `file://`).

**Quick start:**
```bash
./serve.sh
```

Then open http://localhost:8000 in your browser.

**Alternative methods:**
```bash
# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (if you have http-server installed)
npx http-server -p 8000
```

## Recompiling TypeScript

If you modify any `.ts` files, recompile with:

```bash
npx -p typescript tsc
```

Or if you have TypeScript installed globally:

```bash
tsc
```

This compiles both `ram.ts` and `asm.ts` into ES2020 modules (`ram.js` and `asm.js`).

## Architecture

All classes are in the `RAM` namespace:

- `RAM.Symbol` - Single character from the alphabet
- `RAM.Word` - Sequence of symbols
- `RAM.NaturalNumber` - Non-negative integers (ℕ)
- `RAM.MemoryCell` - Fixed-capacity storage
- `RAM.Memory` - Sparse memory (on-demand cell allocation)
- `RAM.Cpu` - Accumulator (acc) and instruction pointer (ip)
- `RAM.Encoding` - Maps between Words ↔ Numbers ↔ Instructions
- `RAM.Machine` - The RAM machine itself

## Instruction Set

All instructions are 2 words (opcode + operand):

| Opcode | Instruction | Description |
|--------|-------------|-------------|
| 1 | ADD V | acc := acc + V |
| 2 | SUB V | acc := acc - V |
| 3 | JUMPZ A | if acc = 0 then ip := A |
| 4 | STORE A | memory[A] := acc |
| 5 | LOAD A | acc := memory[A] |
| 6 | SET V | acc := V |
| 7 | READ A | memory[A] := input |
| 8 | PRINT A | output := memory[A] |
| 0 | HALT | stop execution |

## Assembly Language

Programs can be written in assembly language and assembled automatically:

```assembly
; Example program
.data
value  5
result 0

.code
SET   3
ADD   value
STORE result
PRINT result
HALT
```

### Directives

- `.data` - Declares data segment with variables
- `.code` - Declares code segment with instructions

### Labels

Labels can be used for jump targets:

```assembly
loop: LOAD counter
      SUBTRACT one
      JUMPZ done
      SET 0
      JUMPZ loop
done: HALT
```

## Zero Dependencies

This is completely self-contained:
- No external JavaScript libraries
- No CSS frameworks
- No build tools required
- Just HTML + vanilla JavaScript
