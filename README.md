# RAM Simulator

A pedagogical Random Access Machine (RAM) simulator for algorithms and data structures courses.

## Project Structure

```
ram/
├── src/              # TypeScript source files
│   ├── ram.ts       # RAM machine implementation
│   └── asm.ts       # Assembler (lexer, parser, code generator)
├── tests/           # Test files
│   ├── asm.test.ts
│   └── assembler.test.ts
├── dist/            # Compiled JavaScript (ES2020 modules)
│   ├── ram.js
│   └── asm.js
├── docs/            # Documentation
│   ├── README.md
│   ├── GUIDE.md
│   ├── QUICKSTART.md
│   └── STRUCTURE.md
├── examples/        # Example assembly programs
├── index.html       # Web-based UI
└── serve.sh         # Local development server
```

## Quick Start

1. **Compile TypeScript:**
   ```bash
   npx tsc
   ```

2. **Run tests:**
   ```bash
   npm test
   ```

3. **Start web interface:**
   ```bash
   ./serve.sh
   ```
   Then open http://localhost:8000 in your browser.

## Features

- RAM machine with indirect addressing for all instructions except SET
- Complete assembler with lexer and parser
- Web-based UI for interactive program execution
- Data segment (addresses 0-19) and code segment (addresses 20+)
- Example programs: arithmetic, loops, factorial

## Documentation

See `docs/` directory for detailed documentation:
- `README.md` - Machine architecture and instruction set
- `GUIDE.md` - Assembly language guide
- `QUICKSTART.md` - Getting started tutorial
- `STRUCTURE.md` - Project structure details

## RAM Machine Instructions

All instructions use indirect addressing (read from memory addresses) except SET which uses immediate values:

- `SET n` - Load immediate value n into accumulator
- `ADD addr` - Add value at memory[addr] to accumulator
- `SUBTRACT addr` - Subtract value at memory[addr] from accumulator
- `LOAD addr` - Load value from memory[addr] into accumulator
- `STORE addr` - Store accumulator value to memory[addr]
- `JUMPZ addr` - Jump to addr if accumulator is zero
- `PRINT addr` - Print value at memory[addr]
- `PROMPT addr` - Read input into memory[addr]
- `HALT` - Stop execution
