const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({extended: true}));

const generateRandomString = function(body) {
  const shortURL = (Math.random()*1e32).toString(36).substr(0,7);
  return shortURL;

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
  console.log(req.body, 'RESP', res.body);
  const output = generateRandomString(req.body);
  
  res.send(output)
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
})
