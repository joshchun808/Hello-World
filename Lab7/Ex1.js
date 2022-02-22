require("./products_data.js");



for(count = 1; eval("typeof name"+count) != 'undefined' ; count++) {
    
    console.log(`${count}.    ${eval('name' + count)}` ); 
}
console.log("That's all we have!")