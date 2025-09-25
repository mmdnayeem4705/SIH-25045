const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Import database and models
const { testConnection } = require('./config/database');
const { syncDatabase } = require('./models');

// Import routes
const authRoutes = require('./routes/auth');
const farmerRoutes = require('./routes/farmer');
const govtRoutes = require('./routes/government');
const customerRoutes = require('./routes/customer');
const cropRoutes = require('./routes/crop');
const transactionRoutes = require('./routes/transaction');
const blockchainRoutes = require('./routes/blockchain');
const paymentRoutes = require('./routes/payment');
const traceabilityRoutes = require('./routes/traceability');

// Import middleware
try {
  const errorHandler = require('./middleware/errorHandler');
} catch (e) {
  console.log('⚠️  Using basic error handler');
}

try {
  const logger = require('./middleware/logger');
} catch (e) {
  console.log('⚠️  Logger middleware not found, using basic logging');
}

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3001",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Security middleware
const isDev = (process.env.NODE_ENV || 'development') !== 'production';
if (isDev) {
  // Disable CSP entirely in development to allow eval/new Function and external assets
  app.use(helmet({ contentSecurityPolicy: false }));
} else {
  // Production: keep a strict but functional CSP
  app.use(helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "https:"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "https:", "data:"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: null,
      },
    },
  }));
}
app.use(limiter);

// CORS configuration - Allow all origins in development
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true
}));

// Static files serving
app.use(express.static('public'));

// Serve frontend via backend so Helmet CSP applies (dev convenience)
const frontendDir = path.join(__dirname, '../../frontend');
app.use(express.static(frontendDir));

// Avoid favicon.ico 404 in development (no-op)
app.get('/favicon.ico', (req, res) => res.sendStatus(204));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Basic logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🌾 Agricultural Supply Chain Management System API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth/*',
      farmers: '/api/farmers',
      government: '/api/government/*',
      customers: '/api/customers/*',
      crops: '/api/crops',
      transactions: '/api/transactions',
      blockchain: '/api/blockchain/*',
      payments: '/api/payments',
      traceability: '/api/traceability/*'
    },
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API routes
console.log('📎 Loading API routes...');
try {
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes loaded');
  
  app.use('/api/farmers', farmerRoutes);
  console.log('✅ Farmer routes loaded');
  
  app.use('/api/government', govtRoutes);
  console.log('✅ Government routes loaded');
  
  app.use('/api/customers', customerRoutes);
  console.log('✅ Customer routes loaded');
  
  app.use('/api/crops', cropRoutes);
  console.log('✅ Crop routes loaded');
  
  app.use('/api/transactions', transactionRoutes);
  console.log('✅ Transaction routes loaded');
  
  app.use('/api/blockchain', blockchainRoutes);
  console.log('✅ Blockchain routes loaded');
  
  app.use('/api/payments', paymentRoutes);
  console.log('✅ Payment routes loaded');
  
  app.use('/api/traceability', traceabilityRoutes);
  console.log('✅ Traceability routes loaded');
  
  console.log('✨ All API routes loaded successfully!');
} catch (error) {
  console.error('❌ Error loading routes:', error.message);
}

// WebSocket connection handling for real-time updates
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-farmer-room', (farmerId) => {
    socket.join(`farmer-${farmerId}`);
    console.log(`Farmer ${farmerId} joined their room`);
  });

  socket.on('join-govt-room', (govtId) => {
    socket.join(`govt-${govtId}`);
    console.log(`Government employee ${govtId} joined their room`);
  });

  socket.on('join-customer-room', (customerId) => {
    socket.join(`customer-${customerId}`);
    console.log(`Customer ${customerId} joined their room`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io available throughout the app
app.set('io', io);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Basic error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    
    // Sync database models
    await syncDatabase();
    
    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;