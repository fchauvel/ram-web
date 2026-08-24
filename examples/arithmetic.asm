; Basic Arithmetic Example
; Demonstrates: LOAD, ADD, STORE, PRINT

.data
    value  5
    one    1
    result 0

.code
    LOAD  3
    ADD   value
    STORE result
    PRINT result
    HALT
