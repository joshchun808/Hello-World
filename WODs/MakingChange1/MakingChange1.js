var amt = 1.75
var qrt = .25
var dim = .10
var nik = .05
var pen = .01

var qrt_amt = parseInt(amt/qrt)
var dim_amt = parseInt((amt-(qrt*qrt_amt)))/dim
var nik_amt = parseInt((amt-(qrt*qrt_amt)-(dim*dim_amt)))/nik
var pen_amt = parseInt(amt-(qrt*qrt_amt)-(dim*dim_amt)-(nik*nik_amt))/pen

console.log(`Change is ${qrt_amt} quarters, ${dim_amt} dimes, ${nik_amt} nickels, ${pen_amt} pennies`)