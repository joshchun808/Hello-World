var express = require('express');
var app = express();

var session = require('express-session');
var products_data = require(__dirname + '/products.json');

app.use(express.urlencoded({ extended: true })); //decodes POST requests
app.use(session({secret: "MySecretKey", resave: true, saveUninitialized: true})); //sessions

app.all('*', function (request, response, next) {
    console.log(`Got a ${request.method} to path ${request.path}`);
    // need to initialize an object to store the cart in the session. We do it when there is any request so that we don't have to check it exists
    // anytime it's used
    //if(typeof request.session.cart == 'undefined') { request.session.cart = {}; } 
    next();
});

app.post("/get_products_data", function (request, response) {
    response.json(products_data);
});

/*
app.get("/add_to_cart", function (request, response) {
    var products_key = request.query['products_key']; // get the product key sent from the form post
    var quantities = request.query['quantities'].map(Number); // Get quantities from the form post and convert strings from form post to numbers
    request.session.cart[products_key] = quantities; // store the quantities array in the session cart object with the same products_key. 
    response.redirect('./cart.html');
});
*/

app.post("/update_cart", function (request, response) {
    console.log(request.session);
    var prod_key = request.body.products_key;
    if(typeof request.session.cart == 'undefined') {
        request.session.cart = {};
    }
    request.session.cart[prod_key] = request.body.quantities;
    console.log(request.session);
    response.redirect(`./display_products.html?products_key=${prod_key}`)
});

app.post("/get_cart", function (request, response) {
    response.json(request.session.cart);
});

app.use(express.static(__dirname + '/public'));
app.listen(8080, () => console.log(`listening on port 8080`));