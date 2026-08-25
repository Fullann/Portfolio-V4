const jwt = require('jsonwebtoken');
require('dotenv').config();
const token = jwt.sign({ username: 'test', id: 1 }, process.env.JWT_SECRET || 'secret');
fetch('http://localhost:3000/api/auth/verify', {
  headers: {
    'Cookie': `admin_token=${token}`
  }
}).then(r => {
  console.log('Status:', r.status);
  return r.text();
}).then(console.log).catch(console.error);
