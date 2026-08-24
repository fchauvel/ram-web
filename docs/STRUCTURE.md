# Project Structure

## Overview

This is a complete Random Access Machine (RAM) simulator with assembler, designed as a single-file web application for educational purposes.

## Directory Layout

```
ram/
├── index.html              # Main web interface (includes asm.js and ram.js)
├── ram.ts                  # RAM machine implementation (TypeScript)
├── ram.js                  # Compiled RAM machine (auto-generated)
├── asm.ts                  # Assembler implementation (TypeScript)
├── asm.js                  # Compiled assembler (auto-generated)
├── examples/               # Example assembly programs
│   ├── arithmetic.asm      # Basic arithmetic demo
│   ├── hello.asm           # Character output demo
│   ├── loop.asm            # Loop with JUMP_ZERO demo
│   └── factorial.asm       # Complex control flow demo
├── README.md               # Technical documentation
├── GUIDE.md                # User guide
├── STRUCTURE.md            # This file
├── asm.test.ts             # Lexer tests
├── assembler.test.ts       # Assembler integration tests
├── package.json            # Node.js dependencies (for testing)
└── tsconfig.json           # TypeScript configuration

```

## Architecture

### 1. RAM Machine (`ram.ts`)

Core components in the `RAM` namespace:

- **Symbol** - Single character from the alphabet
- **Word** - Sequence of symbols (represents data)
- **NaturalNumber** - Non-negative integers (ℕ)
- **MemoryCell** - Fixed-capacity storage with observers
- **Memory** - Sparse memory (cells allocated on-demand)
- **Cpu** - Contains ACC (accumulator) and IP (instruction pointer)
- **IO** - Input/output device interface
- **Encoding** - Converts between Words ↔ Numbers ↔ Instructions
- **Machine** - The complete RAM machine
- **Instructions** - Add, Subtract, Load, Store, JumpIfZero, Reset, Print, Read, Halt

### 2. Assembler (`asm.ts`)

Components in the `ASM` namespace:

- **Lexer** - Tokenizes assembly source code
- **Parser** - Builds AST from tokens
- **AST Nodes** - Program, DataSegment, CodeSegment, Instruction, etc.
- **VariableCollector** - First pass: collect labels and variables
- **CodeGenerator** - Second pass: generate machine code
- **SymbolTable** - Maps variable/label names to addresses
- **Assembly** - Container for code and data segments
- **Assembler** - Main assembler class (orchestrates lexing, parsing, code generation)

### 3. Web Interface (`index.html`)

Self-contained HTML file with:

- **CSS Styling** - Custom UI design (no frameworks)
- **Syntax Highlighting** - Real-time assembly code highlighting
- **RAM Machine Integration** - Creates and controls machine instance
- **Assembler Integration** - Assembles code on "Load Program" button
- **UI Components**:
  - Assembly code editor with highlighting
  - CPU register display (ACC, IP)
  - Memory viewer with pagination
  - I/O device (input/output)
  - Control buttons (Load, Start/Stop, Step, Reset)
  - Efficiency metrics (steps, cost, cells used)
  - Example selector (loads from files)

## Data Flow

```
User writes assembly code
    ↓
Click "Load Program"
    ↓
Assembler.assemble(code)
    ↓
Lexer tokenizes → Parser builds AST → Code generator produces Words
    ↓
Assembly loaded into RAM.Machine
    ↓
User clicks "Start" or "Step"
    ↓
Machine executes instructions
    ↓
UI updates (registers, memory, output, metrics)
```

## Memory Layout

The machine uses a simple memory layout:

```
Address 0-19:      Data segment (variables declared in .data)
Address 20+:       Code segment (instructions in .code)
```

Most instructions occupy 2 words:
- Word 0: Opcode (0-8)
- Word 1: Operand (immediate value or address)

Exception: HALT is a single word, with no operand.

## Instruction Encoding

| Opcode | Instruction | Size | Property Name |
|--------|-------------|------|---------------|
| 6 | LOAD | 2 | `value` |
| 1 | ADD | 2 | `operand` |
| 2 | SUBTRACT | 2 | `operand` |
| 4 | STORE | 2 | `address` |
| 3 | JUMP_ZERO | 2 | `target` |
| 8 | PRINT | 2 | `address` |
| 7 | READ | 2 | `address` |
| 0 | HALT | 1 | (no operand) |

## Testing

Tests use Node.js test runner:

```bash
npm test                    # Run all tests
npm test -- asm.test.ts     # Run lexer tests only
npm test -- assembler.test.ts  # Run assembler tests only
```

Test structure:
- **asm.test.ts** - Tests lexer tokenization and text spans
- **assembler.test.ts** - End-to-end tests: assemble → load → run → verify

## Building

Compile TypeScript to JavaScript:

```bash
npx -p typescript tsc       # Compile all .ts files
npm run build:test          # Compile test files
```

## Design Principles

1. **Zero Dependencies** - No external libraries in the runtime HTML
2. **Self-Contained** - Single HTML file can run anywhere
3. **Educational Focus** - Clear, readable code over optimization
4. **Observable** - Event-driven architecture for UI updates
5. **Testable** - Comprehensive test suite for core functionality

## Extension Points

To add new features:

1. **New Instruction** - Add to `ram.ts`:
   - Create instruction class implementing `Instruction` interface
   - Add to `Encoding.codes` array
   - Add to `OperationCode` in `asm.ts`
   - Update `fromInstruction()` to handle the property name

2. **New Example** - Add to `examples/`:
   - Create `.asm` file
   - Add entry to `exampleFiles` in `index.html`
   - Add `<option>` to dropdown

3. **New UI Feature** - Edit `index.html`:
   - Add HTML elements
   - Add event listeners in JavaScript section
   - Subscribe to machine events for updates

## Known Limitations

- Maximum 1000 steps in "Start" mode (prevents infinite loops)
- Memory cells have capacity of 10 digits
- No multiplication or division (must be implemented as loops)
- No indirect addressing
- Fixed code segment start at address 20
- Data segment limited to addresses 0-19 (20 variables max)
