//Author, Joshua Chun
//Based on server.js from Reece Nagaoka, Assignment1, FALL 2021

//from class provided server.js
var express = require('express');
var app = express();
app.all('*', function (request, response, next) {
    console.log(request.method + 'to path' + request.path);
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

//Store user information
var filename = __dirname + '/user_data.json';

//Pull user data file
const fs = require("fs");
if (fs.existsSync(filename)) {
    //Read filename (from my Lab 14 Ex1b.js)
    var user_info = fs.readFileSync(filename, 'utf-8');
    var user_data = JSON.parse(user_info);
}
else {
    console.log(filename + ' does not exist.');
    users_data = {};
}

//Monitors all requests
app.all('*', function (request, response, next) {
    console.log(request.method + ' to path ' + request.path);
    next();
});


//code from lab 11
//helps to check validate data
function isNonNegInt(q, returnErrors = false) {
    errors = []; //assume no errors at first
    if (q == '') q = 0;
    if (Number(q) != q) errors.push('Not a number!'); //Check if string is a number value. 
    else {
        if (q < 0) errors.push('Negative value!'); //Check if it is non-negative
        if (parseInt(q) != q) errors.push('Not an integer!'); //Check that it is an integer
    }
    return returnErrors ? errors : (errors.length == 0);
}

//From lab 12, access inputted data from products.js
app.use(express.urlencoded({ extended: true }));

//Get quantity data from order form and check it
app.post('/process_form', function (request, response) {
    console.log(request.body); //Prof suggestion
    var quantities = request.body["quantity"];
    //Assume no errors or quantities for now 
    var errors = {};
    var check_quantities = false;
    //Check quantities are non-negative integers 
    for (i in quantities) {
        //Check quantity 
        if (isNonNegInt(quantities[i]) == false) {
            errors['quantity_' + i] = `Please choose a valid quantity for ${products[i].name}s`;
        }
        //Check if quantities were selected 
        if (quantities[i] > 0) {
            check_quantities = true;
        }
        //Check if quantity desired is available 
        if (quantities[i] > products[i].quantity_available) {
            errors['available_' + i] = `We don't have ${(quantities[i])} ${products[i].name}s available.`;
        }
    }
    //Check if quantity is selected
    if (!check_quantities) {
        errors['no_quantities'] = `Please select some items!`;
    }

    let params = new URLSearchParams({ "quantity": JSON.stringify(request.body["quantity"]) });

    console.log(Object.keys(errors));
    let qty_obj = { "quantity": JSON.stringify(request.body["quantity"]) };
    //Ask if the object is empty or not 
    if (Object.keys(errors).length == 0) {
        for (i in quantities) {
            products[i].quantity_available -= Number(quantities[i]);
        }
        response.redirect('./login.html?' + params.toString());
    }
    //Otherwise go back to products_display.html 
    else {
        let errs_obj = { "errors": JSON.stringify(errors) };
        console.log(qs.stringify(qty_obj));
        response.redirect('./products_display.html?' + qs.stringify(qty_obj) + '&' + qs.stringify(errs_obj));
    }

});

//Taken from my Lab 14 Ex4.js and modified
//For login
app.post("/login", function (request, response) {
    var errors = {};

    //Process login form POST and redirect to logged in page if ok, back to login page if not
    //Make it so capitalization is irrelevant for email
    let login_email = request.body['email'].toLowerCase();
    let login_password = request.body['password'];

    //Check if email exists
    if (typeof user_data[login_email] != 'undefined') {
        //Then checks password entered matches stored password
        if (user_data[login_email].password == login_password) {
            //Redirects to the invoice page and displays items purchased
            request.query['email'] = login_email;
            response.redirect('./invoice.html?' + qs.stringify(request.query));
            return;
        }
        else {
            //If password is incorrect
            errors = 'Incorrect password';
        }
    }
    else {
        //If email has not been created
        errors = `${login_email} does not exist`;
    }

    //If there are errors, send back to login page with errors
    request.query['email'] = login_email;
    request.query['errors'] = errors;
    response.redirect(`./login.html?` + qs.stringify(request.query));
});

//Taken from my Lab 14 Ex.4.js and modified
//For register
app.post("/register", function (request, response) {
    var errors = {};
    let email = request.body['email'].toLowerCase();
    let name = request.query['name'];

    //Process a simple register form
    //Make it so capitalization is irrelevant for email
    var new_email = request.body['email'].toLowerCase();

    //Require a specific email format
    if (/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(request.body.email) == false) {
        errors = 'Please enter a valid email address';
    }

    //Require a unique email
    if (typeof user_data[new_email] != 'undefined') {
        errors = 'Email is already taken.';
    }

    //Name Check
    if (typeof request.body.name != 'undefined') {
        if (/^[A-Za-z ]+$/.test(request.body.name) == false) {
            errors = 'Please enter a valid name.';
        }
    } else {
        errors = 'Please enter a name.';
    }

    //Require a minimum of 8 characters
    if (request.body.new_password.length < 8) {
        errors = 'Password must have a minimum of 8 characters.';
    }

    //Confirm that both passwords were entered correctly
    if (request.body.new_password !== request.body.repeat_password) {
        errors = 'Both passwords must match';
    }

    let params = new URLSearchParams(request.query);

    //If errors is empty
    if (JSON.stringify(errors) == '{}') {
        //Write data and send to invoice.html
        user_data[new_email] = {};
        user_data[new_email].name = request.body.name;
        user_data[new_email].password = request.body.new_password;

        //Writes user information into file
        fs.writeFileSync(filename, JSON.stringify(user_data), "utf-8");

        //Add email to query
        params.append('email', request.body.email);
        response.redirect('./invoice.html?' + params.toString());
        return;
    }
    else {
        //If there are errors, send back to register page with errors
        request.query['email'] = email;
        request.query['name'] = name;
        request.query['errors'] = errors;
        response.redirect(`./register.html?` + qs.stringify(request.query));
    }
});

//Taken from my Lab 14 Ex4.js and modified
//For new password
app.post("/newpw", function (request, response) {
    var errors = {};

    //Process login form POST and redirect to logged in page if ok, back to login page if not
    //Make it so capitalization is irrelevant for email
    let login_email = request.body['email'].toLowerCase();
    let login_password = request.body['password'];

    //Check if email exists
    if (typeof user_data[login_email] != 'undefined') {
        //Then checks password entered matches stored password
        if (user_data[login_email].password == login_password) {

            //Require a minimum of 8 characters
            if (request.body.new_password.length < 8) {
                errors = 'Password must have a minimum of 8 characters.';
            }

            //Confirm that both passwords were entered correctly
            if (request.body.new_password !== request.body.repeat_password) {
                errors = 'Both passwords must match';
            }

            let params = new URLSearchParams(request.query);

            //If errors is empty
            if (JSON.stringify(errors) == '{}') {
                //Write data and send to invoice.html
                user_data[login_email].password = request.body.new_password

                //Writes user information into file
                fs.writeFileSync(filename, JSON.stringify(user_data), "utf-8");

                //Add email to query
                params.append('email', request.body.email);
                response.redirect('./invoice.html?' + params.toString());
                return;
            }
        }
        else {
            //If password is incorrect
            errors = 'Incorrect password';
        }
    }
    else {
        //If email has not been created
        errors = `${login_email} does not exist`;
    }

    //If there are errors, send back to new password page with errors
    request.query['email'] = login_email;
    request.query['errors'] = errors;
    response.redirect(`./newpw.html?` + qs.stringify(request.query));
});

//from class provided server.js
app.use(express.static('./public'));
app.listen(8080, () => console.log(`listening on port 8080`));