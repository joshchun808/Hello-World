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

//store user information
var filename = __dirname + '/user_data.json';

//pull user data file
const fs = require("fs");
if (fs.existsSync(filename)) {
    //read filename 
    //from Lab 14
    var user_info = fs.readFileSync(filename, 'utf-8');
    var user_data = JSON.parse(user_info);
}
else {
    console.log(filename + ' does not exist.');
    users_data = {};
}

//monitors all requests
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

//from lab 12
//get inputted data from products.js
app.use(express.urlencoded({ extended: true }));

//get quantity data from form and check
app.post('/process_form', function (request, response) {
    console.log(request.body); //Prof suggestion
    var quantities = request.body["quantity"];
    //assume no errors or quantities for now 
    var errors = {};
    var check_quantities = false;
    //check quantities are non-negative integers 
    for (i in quantities) {
        //check quantity 
        if (isNonNegInt(quantities[i]) == false) {
            errors['quantity_' + i] = `Please choose a valid quantity for ${products[i].name}s`;
        }
        //check if quantities were selected 
        if (quantities[i] > 0) {
            check_quantities = true;
        }
        //check if quantity desired is available 
        if (quantities[i] > products[i].quantity_available) {
            errors['available_' + i] = `We don't have ${(quantities[i])} ${products[i].name}s available.`;
        }
    }
    //check if quantity is selected
    if (!check_quantities) {
        errors['no_quantities'] = `Please select some items!`;
    }

    let params = new URLSearchParams({ "quantity": JSON.stringify(request.body["quantity"]) });

    console.log(Object.keys(errors));
    let qty_obj = { "quantity": JSON.stringify(request.body["quantity"]) };
    //check if the object is empty or not 
    if (Object.keys(errors).length == 0) {
        for (i in quantities) {
            products[i].quantity_available -= Number(quantities[i]);
        }
        response.redirect('./login.html?' + params.toString());
    }
    //else, go back to products_display.html 
    else {
        let errs_obj = { "errors": JSON.stringify(errors) };
        console.log(qs.stringify(qty_obj));
        response.redirect('./products_display.html?' + qs.stringify(qty_obj) + '&' + qs.stringify(errs_obj));
    }

});

//from Lab 14 and modified
//login post
app.post("/login", function (request, response) {
    var errors = {};

    //process login form POST, redirect to invoice if ok, back to login page if not
    //make capitalization irrelevant for email
    let login_email = request.body['email'].toLowerCase();
    let login_password = request.body['password'];

    //check if email exists
    if (typeof user_data[login_email] != 'undefined') {
        //checks password entered matches stored password
        if (user_data[login_email].password == login_password) {
            //redirects to invoice page
            request.query['email'] = login_email;
            response.redirect('./invoice.html?' + qs.stringify(request.query));
            return;
        }
        else {
            //error if password is incorrect
            errors = 'Incorrect password';
        }
    }
    else {
        //error if email has not been created
        errors = `${login_email} does not exist`;
    }

    //if any errors, send back to login page with errors
    request.query['email'] = login_email;
    request.query['errors'] = errors;
    response.redirect(`./login.html?` + qs.stringify(request.query));
});

//from Lab 14 and modified
//register post
app.post("/register", function (request, response) {
    var errors = {};
    let email = request.body['email'].toLowerCase();
    let name = request.body['name'];

    //make capitalization irrelevant for email
    var new_email = request.body['email'].toLowerCase();

    //require specific email format
    if (/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(request.body.email) == false) {
        errors = 'Please enter a valid email address';
    }

    //require a unique email
    if (typeof user_data[new_email] != 'undefined') {
        errors = 'Email is already taken.';
    }

    //name Check
    if (typeof request.body.name != 'undefined') {
        if (/^[A-Za-z ]+$/.test(request.body.name) == false) {
            errors = 'Please enter a valid name.';
        }
    } else {
        errors = 'Please enter a name.';
    }

    //require a minimum of 8 characters for password
    if (request.body.new_password.length < 8) {
        errors = 'Password must have a minimum of 8 characters.';
    }

    //confirm that both passwords match
    if (request.body.new_password !== request.body.repeat_password) {
        errors = 'Both passwords must match';
    }

    let params = new URLSearchParams(request.query);

    //if errors is empty
    if (JSON.stringify(errors) == '{}') {
        //write data and send to user_data.html
        user_data[new_email] = {};
        user_data[new_email].name = request.body.name;
        user_data[new_email].password = request.body.new_password;

        //writes user information into file
        fs.writeFileSync(filename, JSON.stringify(user_data), "utf-8");

        //add email to query
        params.append('email', request.body.email);
        response.redirect('./invoice.html?' + params.toString());
        return;
    }
    else {
        //if there are errors, send back to register page with errors
        request.query['email'] = email;
        request.query['name'] = name;
        request.query['errors'] = errors;
        response.redirect(`./register.html?` + qs.stringify(request.query));
    }
});

//from Lab 14 and modified
//new password post
app.post("/newpw", function (request, response) {
    var errors = {};

    //process login form POST, redirect to invoice if ok, back to login page if not
    //make capitalization irrelevant for email
    let login_email = request.body['email'].toLowerCase();
    let login_password = request.body['password'];

    //check if email exists
    if (typeof user_data[login_email] != 'undefined') {
        //checks password entered matches stored password
        if (user_data[login_email].password == login_password) {

            //require a minimum of 8 characters for password
            if (request.body.new_password.length < 8) {
                errors = 'Password must have a minimum of 8 characters.';
            }

            //confirm that both passwords match
            if (request.body.new_password !== request.body.repeat_password) {
                errors = 'Both passwords must match';
            }

            let params = new URLSearchParams(request.query);

            //if errors is empty
            if (JSON.stringify(errors) == '{}') {
                //write data and send to user_data.html
                user_data[login_email].password = request.body.new_password

                //writes user information into file
                fs.writeFileSync(filename, JSON.stringify(user_data), "utf-8");

                //add email to query
                params.append('email', request.body.email);
                response.redirect('./invoice.html?' + params.toString());
                return;
            }
        }
        else {
            //error if password is incorrect
            errors = 'Incorrect password';
        }
    }
    else {
        //error if email has not been created
        errors = `${login_email} does not exist`;
    }

    //if there are errors, send back to new password page with errors
    request.query['email'] = login_email;
    request.query['errors'] = errors;
    response.redirect(`./newpw.html?` + qs.stringify(request.query));
});

//from class provided server.js
app.use(express.static('./public'));
app.listen(8080, () => console.log(`listening on port 8080`));