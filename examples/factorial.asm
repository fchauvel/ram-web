; Factorial Example
; Computes n! = n * (n-1) * (n-2) * ... * 1
; For n=5: 5! = 5*4*3*2*1 = 120

.data
    n       5       ; Input: compute 5!
    counter 0       ; Loop counter (starts at n, counts down)
    result  1       ; Accumulates the product
    one     1       ; Constant for decrement
    temp    0       ; Temporary storage

.code
    ; Initialize counter = n
    READ n
    LOAD 0
    ADD n
    STORE counter

loop:
    ; Check if counter is 0
    LOAD 0
    ADD counter
    JUMP_ZERO done

    ; result = result * counter
    ; We'll do this by repeated addition
    ; temp = result, result = 0, then add temp to result counter times

    LOAD 0
    ADD result
    STORE temp      ; Save current result
    LOAD 0
    STORE result    ; Reset result to 0

    LOAD 0
    ADD counter
    STORE multiply_counter

multiply_loop:
    LOAD 0
    ADD multiply_counter
    JUMP_ZERO multiply_done

    ; result += temp
    LOAD 0
    ADD result
    ADD temp
    STORE result

    ; multiply_counter--
    LOAD 0
    ADD multiply_counter
    SUBTRACT one
    STORE multiply_counter

    LOAD 0
    JUMP_ZERO multiply_loop

multiply_done:
    ; counter--
    LOAD 0
    ADD counter
    SUBTRACT one
    STORE counter

    LOAD 0
    JUMP_ZERO loop

done:
    PRINT result
    HALT

.data
multiply_counter 0
