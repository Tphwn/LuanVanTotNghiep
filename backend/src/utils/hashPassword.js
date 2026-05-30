const bcrypt = require('bcryptjs');

const hash = (password) => bcrypt.hash(password, 10);
const compare = (password, hashed) => bcrypt.compare(password, hashed);

module.exports = { hash, compare };