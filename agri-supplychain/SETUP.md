# 🚀 Agricultural Supply Chain Management System - Setup Guide

This guide will help you set up and run the Agricultural Supply Chain Management System on your local machine.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **PostgreSQL** (v13.0 or higher)
- **Git**
- **npm** or **yarn**
- **Python** (for local server, optional)

## 🛠️ Installation Steps

Here are the exact terminal commands to run both backend and frontend so those links work.

Backend (API on http://127.0.0.1:3000)
- In a new terminal:
bash
cd C:\Users\balin\OneDrive\Desktop\SIH\agri-supplychain\backend
npm install --no-audit --no-fund
npm run migrate
npm run dev

- Verify: open http://127.0.0.1:3000/ (API info) and http://127.0.0.1:3000/health (JSON OK)

Frontend (static server on http://127.0.0.1:8000)
- In a second terminal:
bash
cd C:\Users\balin\OneDrive\Desktop\SIH\agri-supplychain\frontend
python -m http.server 8000 --bind 127.0.0.1
# If Python launcher:
# py -m http.server 8000 --bind 127.0.0.1

- Open the UI:
  - Auth: http://127.0.0.1:8000/auth/index.html
  - Farmer: http://127.0.0.1:8000/farmer-app/index.html
  - Govt: http://127.0.0.1:8000/govt-portal/index.html
  - Customer: http://127.0.0.1:8000/customer-app/index.html

If Python isn’t available, alternative frontend command:
bash
cd C:\Users\balin\OneDrive\Desktop\SIH\agri-supplychain\frontend
npx serve -l 8000 .


Keep both terminals running while you use the app.

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/agri-supplychain.git
cd agri-supplychain
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit environment variables
nano .env
```

#### Environment Variables Configuration

Create a `.env` file in the `backend` directory with the following variables:

```env
# Server Configuration
NODE_ENV=development
PORT=3000
CLIENT_URL=http://localhost:3001

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agri_supplychain
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d

# Blockchain Configuration
BLOCKCHAIN_NETWORK_URL=http://localhost:8545
BLOCKCHAIN_PRIVATE_KEY=your_private_key
FARMER_GOVT_CONTRACT_ADDRESS=0x...
GOVT_CUSTOMER_CONTRACT_ADDRESS=0x...
TRACEABILITY_CONTRACT_ADDRESS=0x...

# Payment Gateway Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
UPI_API_URL=https://api.phonepe.com/v1/payments
BANK_API_URL=your_bank_api_url

# Government Treasury
GOVT_TREASURY_ACCOUNT=your_treasury_account
GOVT_TREASURY_IFSC=your_treasury_ifsc
GOVT_TREASURY_BANK=your_treasury_bank

# Platform Configuration
PLATFORM_FEE_PERCENTAGE=2.5
API_BASE_URL=http://localhost:3000

# External APIs
MARKET_DATA_API=https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070
WEATHER_API=https://api.openweathermap.org/data/2.5/weather
WEATHER_API_KEY=your_weather_api_key

# IPFS Configuration
IPFS_URL=https://ipfs.infura.io:5001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Database Setup

```bash
# Create PostgreSQL database
createdb agri_supplychain

# Run database schema
psql agri_supplychain < ../database/schema.sql

# Or run migrations
npm run migrate
```

### 4. Start Backend Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The backend server will start on `http://localhost:3000`

### 5. Frontend Setup

#### Farmer App

```bash
# Navigate to farmer app directory
cd ../frontend/farmer-app

# Open in browser
# Option 1: Direct file opening
open index.html

# Option 2: Local server (recommended)
python -m http.server 8000
# Then open http://localhost:8000
```

#### Government Portal (Coming Soon)

```bash
cd ../frontend/govt-portal
# Setup instructions will be provided
```

#### Customer App (Coming Soon)

```bash
cd ../frontend/customer-app
# Setup instructions will be provided
```

### 6. Blockchain Setup (Optional)

```bash
# Navigate to blockchain directory
cd ../blockchain

# Install dependencies
npm install

# Compile contracts
truffle compile

# Deploy contracts (requires local blockchain)
truffle migrate

# Or deploy to testnet
truffle migrate --network ropsten
```

## 🧪 Testing the Setup

### 1. Backend API Testing

```bash
# Test health endpoint
curl http://localhost:3000/health

# Test API endpoints
curl http://localhost:3000/api/farmers
```

### 2. Database Connection Test

```bash
# Connect to database
psql agri_supplychain

# Check tables
\dt

# Check sample data
SELECT * FROM farmers LIMIT 5;
```

### 3. Frontend Testing

1. Open `http://localhost:8000` in your browser
2. Navigate through different sections
3. Test form submissions
4. Check responsive design

## 🔧 Configuration Options

### Development Mode

For development, you can use these simplified configurations:

```env
# Minimal development configuration
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_NAME=agri_supplychain_dev
JWT_SECRET=dev_secret_key
```

### Production Mode

For production deployment:

```env
NODE_ENV=production
PORT=3000
# Use strong JWT secret
JWT_SECRET=your_very_strong_secret_key
# Use production database
DB_HOST=your_production_db_host
# Enable all security features
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Database Connection Error

```bash
# Check if PostgreSQL is running
sudo service postgresql status

# Start PostgreSQL if not running
sudo service postgresql start

# Check database exists
psql -l | grep agri_supplychain
```

#### 2. Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use different port
PORT=3001 npm start
```

#### 3. Module Not Found Error

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

#### 4. Frontend Not Loading

```bash
# Check if server is running
curl http://localhost:3000/health

# Check browser console for errors
# Open Developer Tools (F12)
```

### Database Issues

#### Reset Database

```bash
# Drop and recreate database
dropdb agri_supplychain
createdb agri_supplychain
psql agri_supplychain < database/schema.sql
```

#### Check Database Schema

```bash
# Connect to database
psql agri_supplychain

# List all tables
\dt

# Check specific table structure
\d farmers
```

## 📊 Monitoring & Logs

### Backend Logs

```bash
# View application logs
tail -f logs/app.log

# View error logs
tail -f logs/error.log

# View all logs
tail -f logs/*.log
```

### Database Logs

```bash
# PostgreSQL logs (Ubuntu/Debian)
sudo tail -f /var/log/postgresql/postgresql-13-main.log

# PostgreSQL logs (macOS)
tail -f /usr/local/var/log/postgres.log
```

## 🚀 Deployment Options

### Local Development

```bash
# Start all services
npm run dev:all
```

### Docker Deployment

```bash
# Build Docker image
docker build -t agri-supplychain .

# Run with Docker Compose
docker-compose up -d
```

### Cloud Deployment

#### Heroku

```bash
# Install Heroku CLI
# Create Heroku app
heroku create your-app-name

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set DB_HOST=your_db_host

# Deploy
git push heroku main
```

#### AWS/GCP/Azure

Follow cloud provider specific deployment guides.

## 🔒 Security Considerations

### Development

- Use strong JWT secrets
- Don't commit sensitive data to git
- Use environment variables for configuration
- Enable CORS for development only

### Production

- Use HTTPS everywhere
- Implement rate limiting
- Use strong database passwords
- Enable security headers
- Regular security audits

## 📚 Additional Resources

### Documentation

- [API Documentation](docs/api.md)
- [Database Schema](docs/database.md)
- [Blockchain Integration](docs/blockchain.md)
- [Frontend Guide](docs/frontend.md)

### Support

- [GitHub Issues](https://github.com/agrisupplychain/issues)
- [Discord Community](https://discord.gg/agrisupplychain)
- [Email Support](mailto:support@agrisupplychain.com)

## 🎯 Next Steps

After successful setup:

1. **Explore the System**: Navigate through all features
2. **Test Workflows**: Try the complete farmer-to-customer journey
3. **Customize**: Modify configurations for your needs
4. **Deploy**: Deploy to production environment
5. **Scale**: Add more features and integrations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Happy Farming! 🌾**

*For any setup issues, please check the troubleshooting section or create an issue on GitHub.*