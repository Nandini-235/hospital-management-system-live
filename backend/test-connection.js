const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/health',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`✅ Server is running - Status: ${res.statusCode}`);
  res.on('data', (data) => {
    console.log('Response:', JSON.parse(data));
  });
});

req.on('error', (err) => {
  console.log('❌ Server is not running:', err.message);
});

req.end();
