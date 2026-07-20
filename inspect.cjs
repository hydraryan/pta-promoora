const https = require('https');
https.get(process.argv[2], (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
});
