# RAM Simulator User Guide

## Getting Started

1. **Start a local web server** (required for ES6 modules):
   ```bash
   ./serve.sh
   ```
   Or use Python:
   ```bash
   python3 -m http.server 8000
   ```

2. **Open in browser**: http://localhost:8000

3. No installation or build step required - just serve and use!

## Writing Programs

### Assembly Language Basics

Programs have two sections:

```assembly
.data           ; Data section - declare variables
varname value   ; Variable with initial value

.code           ; Code section - your program
INSTRUCTION operand
HALT            ; Always end with HALT
```

### Example Program

```assembly
.data
counter 5
one     1

.code
SET   10
ADD   counter
STORE counter
PRINT counter
HALT
```

## Using the Interface

### 1. Write or Load Code

- **Type directly** in the Assembly Code editor (with syntax highlighting!)
- **Load examples** from the dropdown menu (examples load from `examples/*.asm` files)
- **Tab key** works for indentation

### 2. Load the Program

- Click **"Load Program"** to assemble your code
- Success message shows code and data size
- Errors are displayed if assembly fails

### 3. Execute

Three execution modes:

- **Start** - Run until HALT or error (max 1000 steps)
- **Step** - Execute one instruction at a time (great for learning!)
- **Reset** - Clear machine state

### 4. Observe

Watch the machine state:

- **CPU Registers**: ACC (accumulator) and IP (instruction pointer)
- **Memory**: View and edit memory cells (pagination for large programs)
- **I/O Device**: See output from PRINT instructions
- **Metrics**: Steps executed, cost estimate, memory cells used

## Instruction Set

| Instruction | Description | Example |
|-------------|-------------|---------|
| `SET V` | ACC := V | `SET 5` |
| `ADD V` | ACC := ACC + V | `ADD counter` |
| `SUBTRACT V` | ACC := ACC - V | `SUBTRACT one` |
| `LOAD A` | ACC := memory[A] | `LOAD value` |
| `STORE A` | memory[A] := ACC | `STORE result` |
| `JUMPZ A` | if ACC = 0 then IP := A | `JUMPZ done` |
| `PRINT A` | output := memory[A] | `PRINT result` |
| `HALT` | stop execution | `HALT` |

**Note**: Operands can be:
- Numbers: `SET 5`, `ADD 10`
- Variables: `LOAD counter`, `STORE result`
- Labels: `JUMPZ loop`, `JUMPZ done`

## Labels

Use labels for jump targets:

```assembly
.code
loop: LOAD counter
      SUBTRACT one
      STORE counter
      JUMPZ done
      SET 0
      JUMPZ loop
done: HALT
```

## Tips

1. **Always end with HALT** - programs must explicitly halt
2. **Code starts at address 20**, data at address 0
3. **Use Step mode** to understand how your program executes
4. **Watch the metrics** to analyze algorithm efficiency
5. **Memory view** can be navigated with Prev/Next buttons

## Memory Layout

```
Address 0-19:     Data segment (variables)
Address 20+:      Code segment (instructions)
```

Each instruction occupies 2 memory words (opcode + operand).

## Troubleshooting

**"Assembly error: Unexpected token"**
- Check for typos in instruction names
- Make sure you have `.code` and/or `.data` directives

**"Assembly error: Variable X is not defined"**
- Declare variables in the `.data` section
- Variable names are case-sensitive

**Program doesn't halt**
- Make sure you have a `HALT` instruction
- Check your loop conditions (JUMPZ)
- Use Step mode to debug

## Example Programs

The `examples/` directory contains:

- **hello.asm** - Print characters
- **arithmetic.asm** - Basic arithmetic operations
- **loop.asm** - Loop with counter
- **factorial.asm** - More complex control flow

## Creating Your Own Examples

Add new `.asm` files to the `examples/` directory and update the dropdown in `index.html`:

```javascript
const exampleFiles = {
    myprogram: 'examples/myprogram.asm',
    // ...
};
```

Then add an option to the select element:

```html
<option value="myprogram">My Program</option>
```
