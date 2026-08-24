; Self-Modifying Code Example: Code Generation
;
; This program reads a value from the user and prints it 5 times.
; Instead of using a loop at runtime, it GENERATES 5 PRINT instructions
; by writing them into memory, then executes the generated code.
;
; This demonstrates:
; - Instructions are data (just numbers in memory)
; - Self-modifying code (program modifies itself)
; - Loop unrolling (generating repeated code instead of looping)
;
; SIMPLIFIED APPROACH:
; Instead of computing addresses dynamically, we'll write the
; generated instructions to KNOWN, PRE-ALLOCATED memory locations.
; This makes the example clearer pedagogically.

.data
user_value   0       ; The value to print 5 times
print_opcode 8       ; PRINT instruction opcode
halt_opcode  0       ; HALT instruction opcode

; Pre-allocated space for 5 PRINT instructions + 1 HALT
; Each instruction = 2 words (opcode + operand)
; We'll fill these in at runtime, then execute them
gen_inst1_op  0      ; Will become: PRINT opcode
gen_inst1_arg 0      ; Will become: user_value address
gen_inst2_op  0
gen_inst2_arg 0
gen_inst3_op  0
gen_inst3_arg 0
gen_inst4_op  0
gen_inst4_arg 0
gen_inst5_op  0
gen_inst5_arg 0
gen_halt_op   0      ; Will become: HALT opcode
gen_halt_arg  0      ; (unused)

.code
; ========== STEP 1: Get user input ==========
READ   user_value

; ========== STEP 2: Generate code by writing to memory ==========
; Write instruction 1: PRINT user_value
LOAD   0
ADD    print_opcode
STORE  gen_inst1_op
LOAD   0
ADD    user_value_addr   ; Address of user_value (will be 0)
STORE  gen_inst1_arg

; Write instruction 2: PRINT user_value
LOAD   0
ADD    print_opcode
STORE  gen_inst2_op
LOAD   0
ADD    user_value_addr
STORE  gen_inst2_arg

; Write instruction 3: PRINT user_value
LOAD   0
ADD    print_opcode
STORE  gen_inst3_op
LOAD   0
ADD    user_value_addr
STORE  gen_inst3_arg

; Write instruction 4: PRINT user_value
LOAD   0
ADD    print_opcode
STORE  gen_inst4_op
LOAD   0
ADD    user_value_addr
STORE  gen_inst4_arg

; Write instruction 5: PRINT user_value
LOAD   0
ADD    print_opcode
STORE  gen_inst5_op
LOAD   0
ADD    user_value_addr
STORE  gen_inst5_arg

; Write halt instruction
LOAD   0
ADD    halt_opcode
STORE  gen_halt_op
LOAD   0
STORE  gen_halt_arg

; ========== STEP 3: Execute generated code ==========
; Jump to the generated code (unconditional jump)
LOAD       0
JUMP_ZERO  gen_inst1_op

.data
user_value_addr  0   ; Address where user_value is stored

; ==================================================
; EXPLANATION:
;
; 1. User enters a number (e.g., 42)
;
; 2. Program fills in the pre-allocated instruction slots:
;    gen_inst1_op:  8  (PRINT)    gen_inst1_arg: 0 (user_value)
;    gen_inst2_op:  8  (PRINT)    gen_inst2_arg: 0
;    gen_inst3_op:  8  (PRINT)    gen_inst3_arg: 0
;    gen_inst4_op:  8  (PRINT)    gen_inst4_arg: 0
;    gen_inst5_op:  8  (PRINT)    gen_inst5_arg: 0
;    gen_halt_op:   0  (HALT)     gen_halt_arg:  0
;
; 3. Program jumps to gen_inst1_op, where the generated code starts
;
; 4. CPU executes the generated instructions:
;    - PRINT user_value (42)
;    - PRINT user_value (42)
;    - PRINT user_value (42)
;    - PRINT user_value (42)
;    - PRINT user_value (42)
;    - HALT
;
; Result: 42 is printed 5 times!
;
; This is "loop unrolling" - instead of a loop that iterates,
; we generate the code once and execute it linearly.
; Real compilers do this optimization for performance!
; ==================================================
