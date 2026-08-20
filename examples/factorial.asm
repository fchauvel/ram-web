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
    PROMPT n
    LOAD n
    STORE counter

loop:
    ; Check if counter is 0
    LOAD counter
    JUMPZ done
    
    ; result = result * counter
    ; We'll do this by repeated addition
    ; temp = result, result = 0, then add temp to result counter times
    
    LOAD result
    STORE temp      ; Save current result
    SET 0
    STORE result    ; Reset result to 0
    
    LOAD counter
    STORE multiply_counter
    
multiply_loop:
    LOAD multiply_counter
    JUMPZ multiply_done
    
    ; result += temp
    LOAD result
    ADD temp
    STORE result
    
    ; multiply_counter--
    LOAD multiply_counter  
    SUBTRACT one
    STORE multiply_counter
    
    SET 0
    JUMPZ multiply_loop
    
multiply_done:
    ; counter--
    LOAD counter
    SUBTRACT one
    STORE counter
    
    SET 0
    JUMPZ loop

done:
    PRINT result
    HALT

.data
multiply_counter 0
