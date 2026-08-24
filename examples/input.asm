; Example: Read two numbers from input, add them, and print result
; This demonstrates the READ and PRINT instructions

.data
    num1    0
    num2    0
    sum     0

.code
    READ    num1        ; Read first number
    READ    num2        ; Read second number
    LOAD    0
    ADD     num1        ; Load first number into accumulator
    ADD     num2        ; Add second number
    STORE   sum         ; Store result
    PRINT   sum         ; Print the sum
    HALT
