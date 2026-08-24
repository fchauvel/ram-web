; Loop Example
; Demonstrates: labels, JUMP_ZERO, loops

.data
      counter 5
      one     1

.code
      loop: LOAD  0
            ADD   counter
            PRINT counter
            SUBTRACT one
            STORE counter
            JUMP_ZERO done
            LOAD   0
            JUMP_ZERO loop
      done: HALT
