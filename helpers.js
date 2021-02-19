const bcrypt = require('bcrypt');

//check if user exist and if yes, returns user info
const findUser = function(email, users) {
  const userArray = Object.keys(users);
  for (const key of userArray) {
    if (email === users[key].email) {
      return users[key];
    }
  }
  return undefined;
};



//generates 8 characters string for short url, calls the save to databe se funciton
const generateRandomString = function() {
  const randomString = (Math.random() * 1e32).toString(36).substr(0,7);
  return randomString;
};

//adds new key value pair to database object shortURL : LongURL
const saveURLsToDatabase = function(shortURL, longURL, userID, creationDate, db) {
  db[shortURL] = {longURL, userID, creationDate};
  console.log(db);
  return db;
};

const saveUserToDatabase = function(id, email, password, db) {
  const newUser = db[id] = {
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

const deleteURLsFromDatabase = function(shortURL, db) {
  delete db[shortURL];
  return db;
};

const checkIfUserLoggedIn = function(cookie) {
  if (cookie.user_id) {
  //if (req.session.user_id) {
    return true;
  }
  return false;
};

const getUrlsForUser = (id, db) => {
  let usersUrls = {};
  const urlsArray = Object.keys(db);
  for (const key of urlsArray) {
    if (db[key].userID === id) {
      usersUrls[key] = db[key];
    }
  }
  return usersUrls;
};

const countUniqueVisitors = function(shortURL, db) {
  if (!db[shortURL].visits) {
    return 0;
  } else {
    let count = {};
    console.log();
    let visitorsArray = [];
    for (let visit of db[shortURL].visits) {
      visitorsArray.push(visit[0]);
    }
    visitorsArray.forEach(function(i) {
      count[i] = (count[i] || 0) + 1;
    });
    console.log(count, 'visitor array', visitorsArray);
    let uniqueVisitors = Object.keys(count);
    return uniqueVisitors.length;
  }
};

module.exports = { findUser, generateRandomString, saveURLsToDatabase, saveUserToDatabase, checkUserPassword, deleteURLsFromDatabase, checkIfUserLoggedIn, getUrlsForUser, countUniqueVisitors };
