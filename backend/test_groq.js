const fetch = require('node-fetch');
fetch('http://localhost:5000/api/chat', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({message: 'What is data analysis?'})
}).then(r => r.json()).then(console.log).catch(console.error);
