import { formatSource } from "./src/asm/formatter.js";


const asmCode=`
; This is a sample comment
.data  value 42
       info  567 ; trailing inline comment with 0
       my_array 10 20 30 40
; This should be leading comment for code segment
.code  LOAD value ; more inline comment
; Middle comment
              SET 10
            ADD  info test: STORE result 
       ADD_TWO value, my_array+2, my_array-1
       HALT ; this is a comment
       
; An example of macro
     .macro ADD_TWO left right target
         LOAD {left}
         ADD  {right}
         STORE {target}
     .end

; Another example of macro
.macro ILOAD target 
       LOAD {target}
       ADD   one
       STORE _iload+1
       _iload: LOAD 0
.end       
`

const formatted = formatSource(asmCode);
console.log(formatted); 