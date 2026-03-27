const fs = require('fs');
const b64 = fs.readFileSync('public/icon.png', 'base64');
console.log('data:image/png;base64,' + b64);
