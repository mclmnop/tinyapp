const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');


//Parse the http request so that we can access the user input as req.body
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', "ejs");
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}

//generates 8 characters string for short url, calls the save to databe se funciton
const generateRandomString = function() {
  const randomString = (Math.random() * 1e32).toString(36).substr(0,7);
  return randomString;
};

//adds new key value pair to database object shortURL : LongURL
const saveURLsToDatabase = function(shortURL, longURL) {
  urlDatabase[shortURL] = longURL;
  return urlDatabase;
};

const saveUserToDatabase = function(id, email, password) {
  const newUser = users[id] = {
    id,
    email,
    password
  }
  //console.log('newUser', newUser, Object.keys(users));
  return newUser;
};

const findUser = function(email, users) {
  const userArray = Object.keys(users);
  for (key of userArray){
    if (email === users[key].email)
    {
      return users[key]
    }
  };
  return false;
};
const checkUserPassword = function(user, password) {
  if (user.password === password) {
    return true;
  }
  return false;
};

const deleteURLsFromDatabase = function(shortURL) {
  delete urlDatabase[shortURL];
  return urlDatabase;
};


///////-***********ROUTES***************




app.post("/logout", (req, res) => {
  //console.log(urlDatabase[req.params.shortURL], req.body.newURL)
  res.clearCookie('user_id');
  res.redirect('/urls');
});

// says hello
app.get('/', (req, res) => {
  res.send("Hello!");
});

app.get('/login', (req, res) => {
  const templateVars =  { urls: urlDatabase, userInfo: req.cookies};
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const {email, pwd} = req.body;
  const currentUser = findUser(email, users);
  if (currentUser) {
    if (checkUserPassword(currentUser, pwd)) {
      res.cookie('user_id', email);
      res.redirect('/urls');
    } else {
      res.status(403).send('Bad password');
      
    }
  } else {
    res.status(403).send('User Not found');
  }
});


//registration form
app.get('/register', (req, res) => {
  const templateVars =  { urls: urlDatabase, userInfo: req.cookies};
  res.render("register", templateVars);
});

app.post('/register', (req, res) => {
  const randomID = generateRandomString();
  const {email, pwd} = req.body;
  if(pwd === '') {
    res.status(400).send('No empty passwords allowed');
  } else if (findUser(email, users)) {
    res.status(400).send('Already existing user');
  } else {
  const newUser = saveUserToDatabase(randomID, email, pwd);
  res.cookie('user_id', newUser.email);
  res.redirect("/urls");
  }
});

//urls list
app.get("/urls", (req, res) => {
  const templateVars =  { urls: urlDatabase, userInfo: req.cookies};
  console.log(req.cookies);
  res.render('urls_index.ejs' , templateVars);
});

// form to enter new URL
app.get("/urls/new", (req, res) => {
  const templateVars =  { urls: urlDatabase, userInfo: req.cookies};
  res.render("urls_new", templateVars);
  //res.render("urls_new", templateVars);
});

//takes the user Input from urls/new, sends it to generate a short URL, and redirects to urls/newShort URL
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString(req.body.longURL);
  saveURLsToDatabase(shortURL, req.body.longURL);
  res.redirect(`/urls/${shortURL}`);
});

//shows content of tiny and long
app.post("/urls/:shortURL/delete", (req, res) => {
  deleteURLsFromDatabase(req.params.shortURL);
  res.redirect('/urls');
});

//shows content of tiny and long
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], userInfo: req.cookies};
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL", (req, res) => {
  //console.log(urlDatabase[req.params.shortURL], req.body.newURL)
  urlDatabase[req.params.shortURL] = req.body.newURL;
  saveURLsToDatabase(req.params.shortURL, req.body.newURL);
  //console.log(urlDatabase);
  res.redirect('/urls');
});

//redirects to long URL
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  if (urlDatabase[shortURL]) {
    res.redirect(longURL);
  }
  res.writeHead(404, {"Content-Type": "text/plain"});
  res.write("This short URL does not exist");
  res.end();
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
