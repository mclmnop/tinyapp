const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require('body-parser');

//Parse the http request so that we can access the user input as req.body
app.use(bodyParser.urlencoded({extended: true}));

//
const generateRandomString = function(longURL) {
  const shortURL = (Math.random()*1e32).toString(36).substr(0,7);
  saveURLsToDatabase(shortURL, longURL)
  return shortURL;
}

//adds new key value pair to database object shortURL : LongURL
const saveURLsToDatabase = function(shortURL, longURL) {
  urlDatabase[shortURL] = longURL;
  console.log(urlDatabase)
  return urlDatabase;
}

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
}

app.set('view engine', "ejs")
app.get('/', (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  const templateVars =  { urls: urlDatabase}
  res.render('urls_index.ejs' , templateVars);
})

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.post("/urls", (req, res) => {
  console.log('User input here', req.body);
  const output = generateRandomString(req.body.longURL);
  
  res.redirect(`/urls/${output}`)
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  console.log(req.params)
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL]
  // const longURL = ...
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
})
