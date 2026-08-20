; Example: Read two numbers from input, add them, and print result
; This demonstrates the PROMPT (read) and PRINT instructions

.data
    num1    0
    num2    0
    sum     0

.code
    PROMPT  num1        ; Read first number
    PROMPT  num2        ; Read second number
    LOAD    num1        ; Load first number into accumulator
    ADD     num2        ; Add second number
    STORE   sum         ; Store result
    PRINT   sum         ; Print the sum
    HALT
