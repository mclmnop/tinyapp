const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');
const { findUser, generateRandomString, saveURLsToDatabase, saveUserToDatabase, checkUserPassword, deleteURLsFromDatabase, checkIfUserLoggedIn, getUrlsForUser, countUniqueVisitors } = require('./helpers');
const methodOverride = require('method-override');


//Parses the http request so that we can access the user input as req.body
app.use(bodyParser.urlencoded({extended: true}));

app.set('view engine', "ejs");

//Cookie creation
app.use(cookieSession({
  name: 'session',
  keys: ['7f69fa85-caec-4d9c-acd7-eebdccb368d5', 'f13b4d38-41c4-46d3-9ef6-8836d03cd8eb'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

//Converts POST to PUT or DELETE
app.use(methodOverride('_method'));

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
    password: bcrypt.hashSync("dishwasher-funk",10)
  },
  "user3RandomID": {
    id: "user3RandomID",
    email: "user3@example.com",
    password: bcrypt.hashSync("dishwasher-9moineaux",10)
  }
};


///////-***********ROUTES***************


// redirections  for GET /
app.get('/', (req, res) => {
  if (!req.session.user_id) {
    res.redirect('/login');
  } else {
    res.redirect("/urls");
  }
});

//login page >>> GET = enter credentials, POST = verify credentials
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
  req.session['user_id'] = null;
  res.redirect('/urls');
});

//registration form >>> GET = register form, POST = Create new account
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
    const hashedPwd = bcrypt.hashSync(pwd, 10);
    const newUser = saveUserToDatabase(randomID, email, hashedPwd, users);
    req.session['user_id'] = newUser.email;
    res.redirect("/urls");
  }
});

//My URLS page >>> GET = all urls filtered by user, POST = add new URL
app.get("/urls", (req, res) => {
  if (!checkIfUserLoggedIn(req.session)) {
    res.status(403).send('You need to be logged in to access this page');
    //res.redirect('/login');
  } else {
    const userCreds = findUser(req.session.user_id, users);
    const usersURLS = getUrlsForUser(userCreds.id, urlDatabase);
    const templateVars =  { urls: usersURLS, userInfo: req.session};
    res.render('urls_index.ejs' , templateVars);
  }
});

app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    res.status(403).send('Not allowed');
  } else {
    const shortURL = generateRandomString(req.body.longURL);
    const user = findUser(req.session.user_id, users);
    const creationDate = Date.now();
    saveURLsToDatabase(shortURL, req.body.longURL, user.id, creationDate, urlDatabase);
    res.redirect(`/urls/${shortURL}`);
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

//Edit URl >>> GET = edit URL form, PUT = edits already existing URL
app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;

  if (checkIfUserLoggedIn(req.session)) {
    //finds user id and creates object with all his urls
    let userid = findUser(req.session.user_id, users).id;
    let usersUrls = getUrlsForUser(userid, urlDatabase);

    //checks if requested is in fact owned by requester 
    if (usersUrls[shortURL]) {
      //add unique visitor count to template and render template
      const uniqueVisitors = countUniqueVisitors(shortURL, urlDatabase);
      const templateVars = { shortURL: shortURL, urlInfo: urlDatabase[req.params.shortURL], userInfo: req.session, uniVis: uniqueVisitors};
      res.render("urls_show", templateVars);
    } else {
      res.status(403).send('Oops! Looks like this URL is not yours or does not exist');
      return;
    }
  //if user was not logged in at all
  } else {
    res.status(403).send('You need to be logged in to access this page');
  }
});

app.put("/urls/:shortURL", (req, res) => {
  // if user is logged in
  if (checkIfUserLoggedIn(req.session)) {
    //change long URL with new content
    urlDatabase[req.params.shortURL].longURL = req.body.newURL;
    res.redirect('/urls');
  } else {
    res.status(403).send('Not allowed');
  }
});

app.delete("/urls/:shortURL/delete", (req, res) => {
  if (checkIfUserLoggedIn(req.session)) {
    const userData = findUser(req.session.user_id, users);
    if (urlDatabase[req.params.shortURL].userID === userData.id) {
      deleteURLsFromDatabase(req.params.shortURL, urlDatabase);
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
  const timestamp = Date.now();

  //check if url exists
  if (urlDatabase[shortURL]) {
    
    //initialize the visitor tracking array
    if (!urlDatabase[shortURL].visits) {
      urlDatabase[shortURL].visits = [];
    }
  
    //if we already have a tracking cookie, update the visit list without creating a new onw
    if (req.session['trackingID']) {
      urlDatabase[shortURL].visits.push([req.session.trackingID, timestamp]);
    } else {
      req.session['trackingID'] = generateRandomString();
      urlDatabase[shortURL].visits.push([req.session.trackingID, timestamp]);
    }
    
    //if first visit to the shortURL, put 1 in the DB, otherwise increments
    urlDatabase[shortURL].totalVisits = urlDatabase[shortURL].totalVisits + 1 || 1;

    //All the above should be a helper function but no time, user get redirected to the webwsite
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
