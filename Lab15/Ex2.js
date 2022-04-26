var filename = "./user_data.json";

const fs = require("fs");

if (fs.existsSync(filename)) {
    let stats = fs.statSync(filename);
    console.log(`${filename} has ${stats.size} characters`);
    var data = fs.readFileSync(filename, 'utf-8');
    var users = JSON.parse(data);
    if (typeof users["kazman"] != 'undefined') {
        console.log(users["kazman"].password);
    }
} else {
    console.log(`${filename} does not exist`)
}

var express = require('express');
var app = express();

//part of lab 15 cookies
var cookieParser = require('cookie-parser');
app.use(cookieParser());
//lab 15 sessions
var session = require('express-session');
app.use(session({secret: "MySecretKey", resave: true, saveUninitialized: true}));



app.use(express.urlencoded({ extended: true }));

app.get("/login", function (request, response) {
    // Give a simple login form
    str = `
<body>
<form action="" method="POST">
<input type="text" name="username" size="40" placeholder="enter username" ><br />
<input type="password" name="password" size="40" placeholder="enter password"><br />
<input type="submit" value="Submit" id="submit">
</form>
</body>
    `;
    response.send(str);
});


app.get("/login", function (request, response) {
    //check last time user logged in
    var last_login = 'first visit!';
    if(typeof request.session.last_login != 'undefined') {
        last_login = request.session.last_login
    };

    var welcome_msg = `Welcome, please log in.`
    if(typeof request.cookies.username != "undefined") {
        welcome_msg = `Welcome ${request.cookies.username} you are logged in.`
    }
    // Give a simple register form
    str = `
<body> 
${welcome_msg}
You last logged in on: ${last_login}<br>
<form action="" method="POST">
<input type="text" name="username" size="40" placeholder="enter username" ><br />
<input type="password" name="password" size="40" placeholder="enter password"><br />
<input type="password" name="repeat_password" size="40" placeholder="enter password again"><br />
<input type="email" name="email" size="40" placeholder="enter email"><br />
<input type="submit" value="Submit" id="submit">
</form>
</body>
    `;
    response.send(str);
});

app.post("/login", function (request, response) {
    console.log(request.body) //show post body info
    // Process login form POST and redirect to logged in page if ok, back to login page if not
    if (typeof users[request.body.username] != 'undefined') {
        //username exist, get stored password and check if match
        if (users[request.body.username].password == request.body.password) {
            request.session.last_login = new Date();
            response.cookie('username', request.body.username)
            response.send(`${request.body.username} is logged in`);
            return;
        } else {
            response.send(`Password invalid <br>${str}`);
        }
    } else {
        response.send(`${request.body.username} doesn't exist <br> ${str}`)
    } 
});

app.post("/register", function (request, response) {
    // process a simple register form
    console.log(request.body);
    let username = request.body.username;
    users[username] = {};
    users[username].password = request.body.password;
    users[username].email = request.body.email;
    fs.writeFileSync(filename, JSON.stringify(user_data))
});

//part of lab 15
app.get("/set_cookie", function (request, response) {
    var myname = "Joshua Chun";
    response.cookie('users_name', myname);
    response.send(`cookie sent for ${myname}`)
});

app.get("/expire_cookie", function (request, response) {
    var myname = "Joshua Chun";
    response.cookie('users_name', myname, {expire: Date.now() - 1000});
    response.send(`cookie sent for ${myname}`)
});

app.get("/get_cookie", function (request, response) {
    console.log(request.cookies);
    response.send(`Welcome to the Use Cookie page ${request.cookies[users_name]}`)
});

//sessions
app.get("/use_session", function (request, response) {
    console.log(request.session);
    response.send(`welcome, your session ID is ${request.session.id}`)
    request.session.destroy();
});

app.listen(8080, () => console.log(`listening on port 8080`));
