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

module.exports = { findUser }