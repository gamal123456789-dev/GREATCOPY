const express = require('express');
const app = express();
const port = 3001;

// Middleware to log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  next();
});

app.use(express.json());

// Monitor webhook endpoint
app.post('/webhook-monitor', (req, res) => {
  console.log('\n=== WEBHOOK RECEIVED ===');
  console.log('Time:', new Date().toISOString());
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('========================\n');
  
  res.json({ status: 'received', timestamp: new Date().toISOString() });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Webhook monitor is running',
    timestamp: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(`Webhook monitor running on port ${port}`);
  console.log(`Test URL: http://localhost:${port}/test`);
  console.log(`Webhook URL: http://localhost:${port}/webhook-monitor`);
  console.log('Waiting for webhooks...');
});