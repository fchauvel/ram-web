; Basic Arithmetic Example
; Demonstrates: SET, ADD, STORE, PRINT

.data
    value  5
    one    1
    result 0

.code
    SET   3
    ADD   value
    STORE result
    PRINT result
    HALT
