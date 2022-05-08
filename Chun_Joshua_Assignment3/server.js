//Author, Joshua Chun
//Based on server.js from Reece Nagaoka, Assignment1, FALL 2021
//Individual additional requirements: IR1; Maintain last product page visited by user

//from class provided server.js
var express = require('express');
var app = express();

//loads sessions
var session = require('express-session');


//part of lab 15
//enables cookies
var cookieParser = require('cookie-parser');
app.use(cookieParser());

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
app.use(session({secret: "MySecretKey", resave: true, saveUninitialized: true})); //sessions

//used to view session "cart" data
app.post("/get_cart", function (request, response) {
    response.json(request.session.cart);
});

//used to view session "UD" data
app.post("/get_ud", function (request, response) {
    response.json(request.session.ud);
});

//monitors all requests
app.all('*', function (request, response, next) {
    //if cart is not created, create one
    if(typeof request.session.cart == 'undefined') {
    request.session.cart = {};
    }

    //if ud is not created, create one
    if(typeof request.session.ud == 'undefined') {
        request.session.ud = {};
        }

        console.log(request.method + 'to path' + request.path);
    next();
});

//get quantity data from form and check
app.post('/process_form', function (request, response) {
    console.log(request.body); //Prof suggestion
    console.log(request.session); //check session data
    var this_products_key = request.body.products_key;

    var quantities = request.body["quantity"];
    //assume no errors or quantities for now 
    var errors = {};
    var check_quantities = false;
    //check quantities are non-negative integers 
    for (i in quantities) {
        //check quantity 
        if (isNonNegInt(quantities[i]) == false) {
            errors['quantity_' + i] = `Please choose a valid quantity for ${products[this_products_key][i].name}s`;
        }
        //check if quantities were selected 
        if (quantities[i] > 0) {
            check_quantities = true;
        }
        //Check if quantity desired is available 
        if (quantities[i] > products[this_products_key][i].quantity_available) {
            errors['available_' + i] = `We don't have ${(quantities[i])} ${products[this_products_key][i].name}s available.`;
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
            products[this_products_key][i].quantity_available -= Number(quantities[i]);
        }
        errors['added_to_cart'] = `Items added to cart`;
        let errs_obj = { "errors": JSON.stringify(errors) };
        request.session.cart[this_products_key] = request.body["quantity"]; //set product data to session cart
        console.log(request.session); //show session data
        response.redirect(`./products_display.html?products_key=${this_products_key}` + '&' + qs.stringify(errs_obj));
    }
    //else, go back to products_display.html 
    else {
        let errs_obj = { "errors": JSON.stringify(errors) };
        console.log(qs.stringify(qty_obj));
        response.redirect(`./products_display.html?products_key=${this_products_key}` + '&' + qs.stringify(qty_obj) + '&' + qs.stringify(errs_obj));
    }

});

//logout
app.post("/logout", function (request, response) {
    request.session.ud[user_email] = undefined; //set email to session ud
    request.session.ud[user_name] = undefined //set email to session ud
    response.redirect(`./index.html`)
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
            request.session.ud.user_email = request.body['email'].toLowerCase(); //set email to session ud
            request.session.ud.user_name = user_data[login_email].name; //set email to session ud
            response.redirect(`./index.html`); //IR1, Redirect to last page
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

        request.session.ud.user_email = request.body['email'].toLowerCase(); //set email to session ud
        request.session.ud.user_name = request.body['name']; //set email to session ud
        response.redirect(`./index.html`); //IR1, Redirect to last page
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

                request.session.ud.user_email = request.body['email'].toLowerCase(); //set email to session ud
                request.session.ud.user_name = user_data[login_email].name; //set email to session ud
                response.redirect(`./index.html`); //IR1, Redirect to last page
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

//button to checkout on invoice.html
app.get("/checkout", function (request, response) {
    
    // Generate HTML invoice string
    var invoice_str = `Thank you for your order!
    <table>
    <tr style="background-color: cyan;">
    <td><b>Item</b></td>
    <td><b>Quantity</b></td>
    <td><b>Price</b></td>
    <td><b>Extended price</b></td>
    </tr>`;

    //from invoice
    var sub_total = 0;
    var cart = request.session.cart;
    var ud = request.session.ud
    for (this_products_key in cart) {
        for (i in cart[this_products_key]) {
        let quantities = cart[this_products_key];
        let extended_price = quantities[i] * products[this_products_key][i].price;
        sub_total += extended_price;
        if (quantities[i] > 0) {
            //adds products to invoice string variable
            invoice_str +=` 
          <tr>
          <td><img src=${products[this_products_key][i].image} style="width:75px;height:75px;">
            <b>${products[this_products_key][i].name}</b></td>
          <td style="text-align:center">${Number(quantities[i])}</td>
          <td>$${products[this_products_key][i].price}</td>
        <td><b>$${extended_price}</b></td>
          </tr>
          `
          }
          }
    }

    // Tax Rate
    var tax_rate = 0.0575

    // Shiping Rate
    var shipping = 0

    // Compute Cost
    var tax_total = sub_total * tax_rate
    var total_cost = sub_total + tax_total + shipping

    // Compute Shipping
    if (sub_total > 1000) {
      shipping = sub_total * 0.15
    }
    else if (sub_total < 500) {
      shipping = 50
    }
    else (sub_total < 1000)[
      shipping = 100
    ]

        //adds end of table to invoice string variable
        invoice_str += `
        <tr><td> </td></tr>
        <!--spacer-->
        <tr><td> </td></tr>
        <!--spacer-->
        <tr>
          <td>Sub-total</td>
          <td> </td><td> </td>
          <!--spacer-->
          <td>$${sub_total.toFixed(2)}</td>
        </tr>
        <tr>
          <td>Tax @ 5.75%</td>
          <td> </td><td> </td>
          <!--spacer-->
          <td>$${tax_total.toFixed(2)}</td>
        </tr>
        <tr>
          <td>Shipping</td>
          <td> </td><td> </td>
          <!--spacer-->
          <td>$${shipping.toFixed(2)}</td>
        </tr>
        <tr style="background-color: paleturquoise;">
          <td><b>Total</b></td>
          <td> </td><td> </td>
          <!--spacer-->
          <td><b>$${total_cost.toFixed(2)}</b></td>
        </tr>
    </table>`

    //Sending Email
    //set email var
    var email = request.session.ud.user_email
    
    //from Assignment 3 example
    var nodemailer = require('nodemailer');
    var transporter = nodemailer.createTransport({
        host: "mail.hawaii.edu",
        port: 25,
        secure: false, // use TLS
        tls: {
          // do not fail on invalid certs
          rejectUnauthorized: false
        }
      });

      var mailOptions = {
        from: 'HTF@exampleA3.com',
        to: email,
        subject: 'Your phoney invoice',
        html: invoice_str
      };

      //send email
      //from Assignment 3 example
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          invoice_str += '<br>There was an error and your invoice could not be emailed :(';
        } else {
          invoice_str += `<br>Your invoice was mailed to ${user_email}`;
        }
        response.send(invoice_str);
      });
      

    request.session.destroy(); //gets rid of session
    response.redirect(`./index.html?`)
});

//from class provided server.js
app.use(express.static('./public'));
app.listen(8080, () => console.log(`listening on port 8080`));