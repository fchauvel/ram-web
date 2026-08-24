; Macro Example
; Demonstrates: .macro / .end, macro calls with a parameter

.data
  one     1
  a       3
  b       10

.macro INCR var
  LOAD  0
  ADD   {var}
  ADD   one
  STORE {var}
.end

.code
  INCR a
  INCR a
  INCR b
  PRINT a
  PRINT b
  HALT
