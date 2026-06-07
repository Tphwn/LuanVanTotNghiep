const bcrypt = require('bcryptjs');

bcrypt.hash('123456', 12).then(hash => {
  console.log(hash);
});