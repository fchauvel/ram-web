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

- RAM machine with direct addressing for all instructions except LOAD
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

All instructions address memory directly except LOAD, which takes an immediate constant. There is no instruction to load a value from an address into the accumulator directly; use `LOAD 0` followed by `ADD addr` instead.

- `LOAD c` - Load immediate constant c into accumulator
- `ADD addr` - Add value at memory[addr] to accumulator
- `SUBTRACT addr` - Subtract value at memory[addr] from accumulator
- `STORE addr` - Store accumulator value to memory[addr]
- `JUMP_ZERO addr` - Jump to addr if accumulator is zero
- `PRINT addr` - Print value at memory[addr]
- `READ addr` - Read input into memory[addr]
- `HALT` - Stop execution
