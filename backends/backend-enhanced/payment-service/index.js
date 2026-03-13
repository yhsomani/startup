const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
app.use(helmet());
app.use(cors());

// Raw body parser for Stripe webhooks
app.use(express.json({
  verify: (req, res, buf) => {
    if (req.originalUrl.startsWith('/api/v1/payments/webhook')) {
      req.rawBody = buf.toString();
    }
  }
}));

// TS-2024-004 Workaround: Idempotent queue for webhooks
const webhookQueue = [];
const processedEventIds = new Set();
let isProcessingQueue = false;

async function processWebhookQueue() {
  if (isProcessingQueue || webhookQueue.length === 0) return;
  isProcessingQueue = true;
  
  while (webhookQueue.length > 0) {
    const event = webhookQueue.shift();
    try {
      console.log(`Processing Stripe event: ${event.id} of type ${event.type}`);
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 500));
      // In a real app we update payment statuses in the database here
    } catch (error) {
      console.error(`Failed to process event ${event.id}`, error);
    }
  }
  
  isProcessingQueue = false;
}

app.post('/api/v1/payments/webhook', (req, res) => {
  // Normally we would verify Stripe signature here using req.rawBody
  const event = req.body;
  if (!event || !event.id) {
    return res.status(400).send('Invalid event payload');
  }

  // Idempotency check
  if (processedEventIds.has(event.id)) {
    console.log(`Event ${event.id} already processed or in queue, skipping.`);
    return res.status(200).send('Event already processed');
  }

  processedEventIds.add(event.id);
  webhookQueue.push(event);

  // Return 200 immediately to Stripe to prevent 5s SLA timeouts
  res.status(200).json({ received: true });
  
  // Process asynchronously
  processWebhookQueue().catch(console.error);
});

// Basic endpoints
app.post('/api/v1/payments/checkout', (req, res) => {
  res.json({ message: 'Checkout endpoint mock' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'payment-service' });
});

const PORT = process.env.PORT || 5062;
app.listen(PORT, () => {
  console.log(`Payment Service running on port ${PORT}`);
});
