//Server from lab 12
var express = require('express');
var app = express();

//pull products_data
var products = require('./products_data.json');

const qs = require('querystring');

// Monitors all requests
app.all('*', function (request, response, next) {
    console.log(request.method + ' to path ' + request.path); next();
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
    // Assume no errors or quantities for now 
    var errors = {};
    var check_quantities = false;
    // Check quantities are non-negative integers 
    for (i in quantities) {
        // Check quantity 
        if (isNonNegInt(quantities[i]) == false) {
            errors['quantity_' + i] = `Please choose a valid quantity for ${products[i].name}`;
        }
        // Check if quantities were selected 
        if (quantities[i] > 0) {
            check_quantities = true;
        }
        // Check if quantity desired is available 
        if (quantities[i] > products[i].quantity_available) {
            errors['available_' + i] = `We don't have ${(quantities[i])} ${products[i].name} available.`;
        }
    }
    // Check if quantity is selected
    if (!check_quantities) {
        errors['no_quantities'] = `Please select some items!`;
    }

    let qty_obj = { "quantity": JSON.stringify(request.body["quantity"]) };
    console.log(Object.keys(errors));
    // Ask if the object is empty or not 
    if (Object.keys(errors).length == 0) {
        for (i in quantities) {
            products[i].quantity_available -= Number(quantities[i]);
        }
        response.redirect('./invoice.html?' + qs.stringify(qty_obj));
    }
    // Otherwise go back to products_display.html 
    else {
        let errs_obj = { "errors": JSON.stringify(errors) };
        console.log(qs.stringify(qty_obj));
        response.redirect('./store.html?' + qs.stringify(qty_obj) + '&' + qs.stringify(errs_obj));
    }
});

/* Route all other GET requests to files in public */
app.use(express.static('./public/index.html'));

app.listen(8080, () => console.log(`listening on port 8080`)); // note the use of an anonymous function here to do a callback