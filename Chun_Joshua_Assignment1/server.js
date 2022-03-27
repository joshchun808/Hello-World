// Based on server.js from Reece Nagaoka, FALL 2021

//from server.js
var argv = require('minimist')(process.argv.slice(2));
var express = require('express');
var app = express();
app.all('*', function (request, response, next) {
    console.log(request.method + ' to path ' + request.path);
    next();
});

//pull products_data
var products = require(__dirname + '/products_data.json');

app.get("/products_data.js", function (request, response, next) {
   response.type('.js');
   var products_str = `var products = ${JSON.stringify(products)};`;
   response.send(products_str);
});

const qs = require('querystring');

// Monitors all requests
app.all('*', function (request, response, next) {
    console.log(request.method + ' to path ' + request.path);
    next();
});


//code from lab 11
//helps to check validate data
function isNonNegInt(q, returnErrors = false) {
    errors = []; // assume no errors at first
    if (q == '') q = 0;
    if (Number(q) != q) errors.push('Not a number!'); // Check if string is a number value. 
    else {
        if(q>25) errors.push('Not enough in stock. '); //checks quantity
        if (q < 0) errors.push('Negative value!'); // Check if it is non-negative

        if (parseInt(q) != q) errors.push('Not an integer!'); // Check that it is an integer

    }
    return returnErrors ? errors : (errors.length == 0);
}
//From lab 12, access inputted data from products.js
app.use(express.urlencoded ({extended: true }));

// Get quantity data from order form and check it 
app.post('/process_form', function (request, response) {
    var quantities = request.body["quantity"];
    // Assume no errors  
    var errors = {};
    // Check quantities are non-negative integers 
    for (i in quantities) {
        // Check quantity 
        if (isNonNegInt(quantities[i]) == false) {
            errors['quantity_' + i] = `Please choose a valid quantity for ${products[i].name}`;
        }
        
        // Check if quantity desired is available 
        if (quantities[i] > products[i].quantity_available) {
            errors['available_' + i] = `We don't have ${(quantities[i])} ${products[i].name} available.`;
        }
    }
    

    let qty_obj = { "quantity": JSON.stringify(request.body["quantity"]) };
    console.log(Object.keys(errors), qty_obj);
    // Ask if the object is empty or not 
    if (Object.keys(errors).length == 0) {
        for (i in quantities) {
            products[i].quantity_available -= Number(quantities[i]);
        }
        response.redirect('./public/invoice.html?' + qs.stringify(qty_obj));
    }
    // Otherwise go back to products_display.html 
    else {
        let errs_obj = { "errors": JSON.stringify(errors) };
        console.log(qs.stringify(qty_obj));
        response.redirect('./public/store.html?' + qs.stringify(qty_obj) + '&' + qs.stringify(errs_obj));
    }
});

//from server.js
app.use(express.static( (typeof argv["rootdir"] != "undefined")?argv["rootdir"] : "." ) );
app.listen(8080, () => console.log(`listening on port 8080`));