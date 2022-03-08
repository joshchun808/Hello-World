day = 23;
month = "September";
year = 1998;

step1 = year - 1900;
step2 = parseInt(step1/4);
step3 = step2 + step1;
step4 = 5;
step6 = step4 + step3;
step7 = day + step6;
step8 = step7;
step9 = step8 % 7;


console.log(step9);
