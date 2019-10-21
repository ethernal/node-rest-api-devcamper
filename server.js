const http = require('http');

const todos = [
  { id: 1, text: `One` },
  { id: 2, text: `Two` },
  { id: 3, text: `Three` },
];

const server = http.createServer((req, res) => {
  res.writeHead(404, {
    'Content-Type': 'application/json',
    'X-Powered-By': 'Node.js',
  });

  res.end(
    JSON.stringify({
      success: false,
      error: 'Please fill out email..',
      data: null,
    })
  );
});

const PORT = 5000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
