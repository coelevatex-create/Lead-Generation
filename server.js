const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));
app.use(cors());
app.use(helmet());
app.use(require('./middleware/logger'));
app.use(morgan('dev'));

// Routes
// VAPI Webhook needs validation
app.use('/webhook/vapi', require('./middleware/validateVapi'), require('./routes/webhook'));
app.use('/api/leads', require('./routes/leadRoutes'));
app.use('/api/plans', require('./routes/loanPlanRoutes'));
app.use('/api/finance', require('./routes/financeRoutes'));
app.use('/api/callbacks', require('./routes/callbackRoutes'));
app.use('/api/vapi', require('./routes/vapiRoutes'));

app.get('/', (req, res) => {
  res.send('Loan AI CRM API is running...');
});

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5500;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
