; Loop Example
; Demonstrates: labels, JUMPZ, loops

.data
      counter 5
      one     1

.code
      loop: LOAD  counter
            PRINT counter
            SUBTRACT one
            STORE counter
            JUMPZ done
            SET   0
            JUMPZ loop
      done: HALT
