const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');


//Parse the http request so that we can access the user input as req.body
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//generates 8 characters string for short url, calls the save to databe se funciton
const generateRandomString = function(longURL) {
  const shortURL = (Math.random() * 1e32).toString(36).substr(0,7);
  saveURLsToDatabase(shortURL, longURL);
  return shortURL;
};

//adds new key value pair to database object shortURL : LongURL
const saveURLsToDatabase = function(shortURL, longURL) {
  urlDatabase[shortURL] = longURL;
  return urlDatabase;
};

const deleteURLsFromDatabase = function(shortURL) {
  delete urlDatabase[shortURL];
  return urlDatabase;
};


///////-***********ROUTES***************

app.post("/login", (req, res) => {
  //console.log(urlDatabase[req.params.shortURL], req.body.newURL)
  const user = req.body.userName;
  res.cookie(user)
  console.log(user)
  //console.log(urlDatabase);
  res.redirect('/urls');
});

// says hello
app.get('/', (req, res) => {
  res.send("Hello!");
});

//urls list
app.get("/urls", (req, res) => {
  const templateVars =  { urls: urlDatabase};
  res.render('urls_index.ejs' , templateVars);
});

// form to enter new URL
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

//takes the user Input from urls/new, sends it to generate a short URL, and redirects to urls/newShort URL
app.post("/urls", (req, res) => {
  const output = generateRandomString(req.body.longURL);
  res.redirect(`/urls/${output}`);
});

//shows content of tiny and long
app.post("/urls/:shortURL/delete", (req, res) => {
  deleteURLsFromDatabase(req.params.shortURL);
  res.redirect('/urls');
});

//shows content of tiny and long
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
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
