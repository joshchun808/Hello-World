month = 'September';
day = 23;
year = 1998;

month_key = {
    January:0,
    February:3,
    March:2,
    April:5,
    May:0,
    June:3,
    July:5,
    August:1,
    September:4,
    October:6,
    November:2,
    December:4,
}

day_number = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

step1 = (month == 'January' || month == 'February')? (year-1):year;
step2 = parseInt(step1/4)+step1;
step3 = step2- parseInt(step1/100);
step4 = parseInt(step1/400)+step3;
step5 = day+step4;
step6 = month_key[month]+step5;
step7 = step6%7;

console.log(`Day of the week is ${day_number[step7]}`)
