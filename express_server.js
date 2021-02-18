const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');
const { findUser } = require('./helpers')


//Parse the http request so that we can access the user input as req.body
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ['7f69fa85-caec-4d9c-acd7-eebdccb368d5', 'f13b4d38-41c4-46d3-9ef6-8836d03cd8eb'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

const urlDatabase = {
  "b2xVn2": {longURL: "http://www.lighthouselabs.ca", userID: "ghj7tedh"},
  "9sm5xK": {longURL:"http://www.google.com", userID: "userRandomID"}
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  },
  "user3RandomID": {
    id: "user3RandomID",
    email: "user3@example.com",
    password: "dishwasher-9moineaux"
  }
};

//generates 8 characters string for short url, calls the save to databe se funciton
const generateRandomString = function() {
  const randomString = (Math.random() * 1e32).toString(36).substr(0,7);
  return randomString;
};

//adds new key value pair to database object shortURL : LongURL
const saveURLsToDatabase = function(shortURL, longURL, userID) {
  urlDatabase[shortURL] = {longURL, userID};
  console.log(urlDatabase);
  return urlDatabase;
};

const saveUserToDatabase = function(id, email, password) {
  const newUser = users[id] = {
    id,
    email,
    password
  };
  //console.log('newUser', newUser, 'db', users);
  return newUser;
};

const checkUserPassword = function(user, password) {
  //if (user.password === password) {
  if (bcrypt.compareSync(password, user.password)) {
    return true;
  }
  return false;
};

const deleteURLsFromDatabase = function(shortURL) {
  delete urlDatabase[shortURL];
  return urlDatabase;
};

const checkIfUserLoggedIn = function(cookie) {
  if (cookie.user_id) {
  //if (req.session.user_id) {
    return true;
  }
  return false;
};

const urlsForUser = (id) => {
  let usersUrls = {};
  const urlsArray = Object.keys(urlDatabase);
  for (const key of urlsArray) {
    //console.log(urlDatabase[key].userID, id)
    if (urlDatabase[key].userID === id) {
      usersUrls[key] = urlDatabase[key];
    }
  }
  return usersUrls;
};



///////-***********ROUTES***************


// says hello
app.get('/', (req, res) => {
  res.send("Hello!");
});

//login page GET = enter credentials POST = verify credentials
app.get('/login', (req, res) => {
  const templateVars =  { urls: urlDatabase, userInfo: req.session};
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const {email, pwd} = req.body;
  const currentUser = findUser(email, users);
  if (currentUser) {
    if (checkUserPassword(currentUser, pwd)) {
      req.session['user_id'] = email;
      res.redirect('/urls');
    } else {
      res.status(403).send('Bad password'); 
    }
  } else {
    res.status(403).send('User Not found');
  }
});

//logout - clears cookie
app.post("/logout", (req, res) => {
  //console.log(urlDatabase[req.params.shortURL], req.body.newURL)
  req.session['user_id'] = null;
  res.redirect('/login');
});

//registration form GET = register form, POST = Create new account
app.get('/register', (req, res) => {
  const templateVars =  { urls: urlDatabase, userInfo: req.session};
  res.render("register", templateVars);
});

app.post('/register', (req, res) => {
  const randomID = generateRandomString();
  const {email, pwd} = req.body;
  if (pwd === '') {
    res.status(400).send('No empty passwords allowed');
  } else if (findUser(email, users)) {
    res.status(400).send('Already existing user');
  } else {
    const hashedPwd = bcrypt.hashSync(pwd, 10)
    const newUser = saveUserToDatabase(randomID, email, hashedPwd);
    req.session['user_id'] = newUser.email;
    console.log(req.session['user_id'])
    //res.cookie('user_id', newUser.email);
    res.redirect("/urls");
  }
});

//My URLS page GET = all urls filtered by user POST = add new URL
app.get("/urls", (req, res) => {
  if (!checkIfUserLoggedIn(req.session)) {
    res.status(403).send('You can\'t access this page');
    //res.redirect('/login');
  } else {
    const userCreds = findUser(req.session.user_id, users);
    const usersURLS = urlsForUser(userCreds.id);
    //console.log(usersURLS)
    const templateVars =  { urls: usersURLS, userInfo: req.session};
    res.render('urls_index.ejs' , templateVars);
  }
});

app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    res.redirect('/login');
    return;
  } else {
    const shortURL = generateRandomString(req.body.longURL);
    const user = findUser(req.session.user_id, users);
    saveURLsToDatabase(shortURL, req.body.longURL, user.id);
    res.redirect(`/urls`);
  }
});

// form to enter new URL
app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    res.redirect('/login');
    return;
  }
  const templateVars =  { urls: urlDatabase, userInfo: req.session};
  res.render("urls_new", templateVars);
});

//Edit GET = edit URL form POST = edits already existing URL
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], userInfo: req.session};
  res.render("urls_show", templateVars);
});


app.post("/urls/:shortURL", (req, res) => {
  //console.log(urlDatabase[req.params.shortURL], req.body.newURL)
  if (checkIfUserLoggedIn(req.session)) {
    console.log(urlDatabase[req.params.shortURL])
    urlDatabase[req.params.shortURL].longURL = req.body.newURL;
    const user = findUser(req.session.user_id, users);
    saveURLsToDatabase(req.params.shortURL, req.body.newURL, user.id);
    res.redirect('/urls');
  } else {
    res.status(403).send('Not allowed');
  }
});

//delete URL
app.post("/urls/:shortURL/delete", (req, res) => {
  if (checkIfUserLoggedIn(req.session)) {
    const userData = findUser(req.session.user_id, users);
    if (urlDatabase[req.params.shortURL].userID === userData.id ) {
      deleteURLsFromDatabase(req.params.shortURL);
      res.redirect('/urls');
    } else {
      res.status(403).send('Not allowed');
    }
  } else {
    res.status(403).send('Not allowed');
  }
});

//redirect to long URL
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if (urlDatabase[shortURL]) {
    res.redirect(urlDatabase[shortURL].longURL);
  } else {
    res.writeHead(404, {"Content-Type": "text/plain"});
    res.write("This short URL does not exist");
    res.end();
  }

});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
