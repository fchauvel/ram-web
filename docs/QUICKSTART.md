# Quick Start

## Running the Simulator

**You need a local web server** because the simulator uses ES6 modules.

### Quick Start

```bash
./serve.sh
```

Then open http://localhost:8000 in your browser.

### Alternative Servers

```bash
# Python 3
python3 -m http.server 8000

# Python 2  
python -m SimpleHTTPServer 8000

# Node.js
npx http-server -p 8000
```

## Making Changes

### 1. Edit TypeScript Files

Modify `ram.ts` (machine) or `asm.ts` (assembler) as needed.

### 2. Recompile

```bash
npx -p typescript tsc
```

Or if TypeScript is installed globally:

```bash
tsc
```

This generates `ram.js` and `asm.js` as ES2020 modules.

### 3. Reload Browser

Refresh the browser to see your changes.

## Running Tests

```bash
npm test
```

## Project Structure

```
ram/
├── index.html          # Main interface (open this in browser)
├── ram.ts             # RAM machine (TypeScript source)
├── ram.js             # RAM machine (compiled JavaScript)
├── asm.ts             # Assembler (TypeScript source)
├── asm.js             # Assembler (compiled JavaScript)
├── examples/          # Example assembly programs
├── tsconfig.json      # TypeScript configuration
└── tsconfig.test.json # TypeScript test configuration
```

## Adding Examples

1. Create a new `.asm` file in `examples/`
2. Edit `index.html`, find the `exampleFiles` object
3. Add your example: `myexample: 'examples/myexample.asm'`
4. Add dropdown option: `<option value="myexample">My Example</option>`

## Key Features

- ✅ **Zero dependencies** at runtime (pure HTML/JS/CSS)
- ✅ **ES2020 modules** for clean code organization
- ✅ **Full assembler** with labels and variables
- ✅ **Syntax highlighting** in the editor
- ✅ **Step-by-step execution** for learning
- ✅ **Memory visualization** with pagination
- ✅ **Example programs** loaded from files

## Modern Browser Required

The simulator uses ES2020 features (ES6 modules, private class fields). Works in:
- Chrome/Edge 80+
- Firefox 75+
- Safari 14+

No polyfills needed for modern browsers!
