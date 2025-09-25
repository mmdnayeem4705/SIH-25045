# 🌾 Agricultural Supply Chain Management System

A comprehensive blockchain-based platform that eliminates middlemen exploitation, ensures transparent pricing, and provides complete farm-to-fork traceability for agricultural products.

## 🎯 Project Objectives

### ✅ Eliminate Middlemen Exploitation
- Connect farmers directly with government and customers
- Ensure farmers get fair share of profit instead of losing margin to brokers
- Transparent pricing with AI-based predictions + government approval

### ✅ Guarantee Transparent & Fair Pricing
- AI-based price prediction with government employee approval
- Show customers & farmers exact pricing history on blockchain
- Real-time market data integration

### ✅ Instant & Secure Payments
- Integrate UPI/Bank APIs with Smart Contracts for instant farmer payments
- Store proof of every transaction on blockchain
- Automated payment processing with receipt generation

### ✅ Farm-to-Fork Traceability
- Customers can scan QR codes to view:
  - Farmer details and verification
  - Government verification reports
  - Price history & payment trail
  - Complete journey from farm to customer

### ✅ Dual-Mode Access (Online + Offline)
- **Online**: Farmers register crops digitally
- **Offline**: Farmers without smartphones can visit government collection centers
- All transactions recorded in blockchain regardless of access method

### ✅ Quality Verification & Certification
- Government employees validate crop grade, quality, and authenticity
- Reports stored in IPFS/Filecoin for tamper-proof certification
- Digital signatures and verification records

### ✅ Reduce Government Regulatory Burden
- Automate compliance & verification with blockchain
- Government dashboard for real-time monitoring
- Automated reporting and analytics

### ✅ Increase Customer Trust
- Customers buy crops knowing source → quality → price transparently
- Eliminates fake/low-quality products entering supply chain
- Complete transparency in the supply chain

### ✅ Scalability for National Adoption
- System can be expanded to district → state → national level
- Potential integration with Digital India, eNAM, PM-Kisan, and ONDC initiatives

## 🏗️ System Architecture

```
agri-supplychain/
│
├── backend/                    # Node.js Backend API
│   ├── src/
│   │   ├── auth/              # Authentication system
│   │   ├── controllers/        # Request handlers
│   │   ├── services/          # Business logic
│   │   │   ├── pricingService.js      # AI-based price prediction
│   │   │   ├── paymentService.js     # UPI/Bank integration
│   │   │   ├── traceabilityService.js # QR code & traceability
│   │   │   ├── blockchainService.js   # Smart contract interaction
│   │   │   └── offlineService.js     # Offline support
│   │   ├── models/            # Database models
│   │   ├── routes/            # API endpoints
│   │   └── middleware/        # Authentication & error handling
│
├── blockchain/                # Smart Contracts
│   ├── contracts/
│   │   ├── FarmerGovt.sol     # Farmer → Government transactions
│   │   ├── GovtCustomer.sol   # Government → Customer transactions
│   │   └── Traceability.sol   # QR traceability & history
│   └── scripts/               # Deployment scripts
│
├── frontend/                  # Frontend Applications
│   ├── farmer-app/           # Farmer mobile/web app
│   ├── govt-portal/          # Government verification dashboard
│   └── customer-app/         # Customer marketplace & QR scanner
│
├── database/                  # Database Schema
│   ├── schema.sql            # Complete database schema
│   └── migrations/           # Database migrations
│
└── docs/                     # Documentation
    ├── workflow.png          # System workflow diagram
    ├── architecture.png      # System architecture
    └── report.pdf           # Project report
```

## 🔄 Workflow

### 1. Farmer → Government Employee
1. **Farmer Registration**: Online or offline at collection centers
2. **Crop Registration**: Farmer registers crop with details
3. **Quality Verification**: Government employee verifies quality & grade
4. **AI Price Prediction**: AI engine suggests fair price based on:
   - Historical data
   - Market conditions
   - Weather factors
   - Quality metrics
5. **Price Approval**: Government employee approves price
6. **Smart Contract Payment**: Automatic payment to farmer via UPI/Bank
7. **Blockchain Recording**: Transaction recorded on blockchain

### 2. Government Employee → Customer
1. **Crop Listing**: Verified crops listed on customer marketplace
2. **Customer Purchase**: Customers browse and purchase crops
3. **Payment Processing**: Customer pays via UPI/Bank
4. **Government Treasury**: Money goes to government treasury
5. **Blockchain Logging**: Sale recorded on blockchain

### 3. Transparency & Traceability
1. **QR Code Generation**: Each crop gets unique QR code
2. **Customer Scanning**: Customers scan QR code to view:
   - Farmer information and verification
   - Government verification reports
   - Complete price history
   - Payment trail
   - Quality certifications

## 🚀 Key Features

### 🤖 AI-Based Price Prediction
- **Multi-factor Analysis**: Market data, weather, quality, demand, seasonality
- **Confidence Scoring**: AI provides confidence levels for predictions
- **Real-time Updates**: Prices updated based on current market conditions
- **Historical Analysis**: Learning from past transactions and market trends

### 💳 Instant Payment System
- **UPI Integration**: Direct UPI payments to farmers
- **Bank Transfer Support**: Traditional bank transfers
- **Digital Wallet**: Support for various digital wallets
- **Smart Contract Automation**: Automatic payment processing
- **Receipt Generation**: Digital receipts with QR codes

### 📱 Dual-Mode Access
- **Online Mode**: Full digital experience for smartphone users
- **Offline Mode**: Collection centers for farmers without smartphones
- **Seamless Integration**: Both modes sync to same blockchain
- **Local Language Support**: Hindi and regional language support

### 🔍 Complete Traceability
- **QR Code System**: Unique QR codes for each crop batch
- **Journey Tracking**: Complete journey from farm to customer
- **Quality Verification**: Government-verified quality reports
- **IPFS Storage**: Tamper-proof document storage
- **Blockchain Records**: Immutable transaction history

### 🏛️ Government Portal
- **Real-time Monitoring**: Live dashboard of all activities
- **Quality Verification**: Tools for crop verification
- **Price Approval**: Interface for price approval workflow
- **Analytics & Reports**: Comprehensive reporting system
- **User Management**: Manage farmers, employees, and customers

### 🛒 Customer Marketplace
- **Product Browsing**: Browse verified crops with details
- **QR Code Scanning**: Scan QR codes for traceability
- **Secure Payments**: Multiple payment options
- **Order Tracking**: Track orders from purchase to delivery
- **Quality Assurance**: Government-verified quality

## 🛠️ Technology Stack

### Backend
- **Node.js**: Server runtime
- **Express.js**: Web framework
- **Sequelize**: ORM for database
- **PostgreSQL**: Primary database
- **JWT**: Authentication
- **Socket.io**: Real-time communication

### Blockchain
- **Solidity**: Smart contract language
- **Ethereum**: Blockchain platform
- **Web3.js**: Blockchain interaction
- **Truffle**: Development framework

### Frontend
- **HTML5/CSS3**: Modern web standards
- **JavaScript (ES6+)**: Client-side logic
- **Responsive Design**: Mobile-first approach
- **PWA Support**: Progressive Web App features

### AI & Analytics
- **Machine Learning**: Price prediction algorithms
- **Data Analytics**: Market trend analysis
- **Weather API**: Real-time weather data
- **Market Data**: External market data integration

### Storage & Security
- **IPFS**: Decentralized file storage
- **Filecoin**: Long-term storage
- **Encryption**: Data encryption at rest and in transit
- **Digital Signatures**: Document authenticity

## 📊 Database Schema

### Core Entities
- **Farmers**: Farmer profiles and verification
- **Government Employees**: Staff and permissions
- **Customers**: Customer profiles and preferences
- **Crops**: Crop registration and details
- **Transactions**: Financial transactions
- **Collection Centers**: Offline support centers

### Traceability
- **Traceability Records**: Complete crop journey
- **Verification Records**: Quality verification data
- **Journey Steps**: Step-by-step tracking
- **QR Codes**: Unique identifiers

### Analytics
- **Price Predictions**: AI-generated price data
- **System Logs**: Application logs
- **Notifications**: User notifications
- **Offline Transactions**: Offline mode data

## 🔧 Installation & Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- Git
- npm/yarn

### Backend Setup
```bash
cd agri-supplychain/backend
npm install
cp .env.example .env
# Configure environment variables
npm run migrate
npm start
```

### Database Setup
```bash
# Create database
createdb agri_supplychain

# Run schema
psql agri_supplychain < database/schema.sql
```

### Frontend Setup
```bash
cd agri-supplychain/frontend/farmer-app
# Open index.html in browser
# Or serve with local server
python -m http.server 8000
```

### Blockchain Setup
```bash
cd agri-supplychain/blockchain
npm install
truffle compile
truffle migrate
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Farmers
- `GET /api/farmers` - Get farmer profile
- `PUT /api/farmers` - Update farmer profile
- `GET /api/farmers/crops` - Get farmer's crops
- `POST /api/farmers/crops` - Register new crop

### Government
- `GET /api/government/dashboard` - Government dashboard
- `POST /api/government/verify-crop` - Verify crop quality
- `POST /api/government/approve-price` - Approve crop price
- `GET /api/government/centers` - Get collection centers

### Customers
- `GET /api/customers/marketplace` - Browse crops
- `POST /api/customers/purchase` - Purchase crop
- `GET /api/customers/orders` - Get order history
- `POST /api/customers/scan-qr` - Scan QR code

### Traceability
- `GET /api/traceability/crop/:id` - Get crop traceability
- `POST /api/traceability/generate-qr` - Generate QR code
- `GET /api/traceability/scan/:qrCode` - Scan QR code

### Payments
- `POST /api/payments/process` - Process payment
- `GET /api/payments/history` - Payment history
- `POST /api/payments/refund` - Process refund

## 🔒 Security Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control
- Multi-factor authentication support
- Session management

### Data Security
- End-to-end encryption
- Secure API endpoints
- Input validation and sanitization
- SQL injection prevention

### Blockchain Security
- Smart contract security audits
- Immutable transaction records
- Digital signatures
- Tamper-proof data storage

## 📱 Mobile Support

### Progressive Web App (PWA)
- Offline functionality
- Push notifications
- App-like experience
- Installable on mobile devices

### Responsive Design
- Mobile-first approach
- Touch-friendly interface
- Optimized for various screen sizes
- Local language support

## 🌍 Scalability & Integration

### National Adoption
- Multi-state support
- District-level management
- State-level coordination
- National-level analytics

### Government Integration
- Digital India initiative
- eNAM integration
- PM-Kisan scheme integration
- ONDC platform support

### Third-party Integrations
- Weather APIs
- Market data providers
- Payment gateways
- Government databases

## 📈 Analytics & Reporting

### Farmer Analytics
- Earnings tracking
- Crop performance
- Market trends
- Quality metrics

### Government Analytics
- Regional performance
- Quality statistics
- Payment analytics
- Compliance reports

### System Analytics
- Usage statistics
- Performance metrics
- Error tracking
- User behavior

## 🚀 Future Enhancements

### Advanced AI Features
- Predictive analytics
- Disease detection
- Yield prediction
- Market forecasting

### IoT Integration
- Soil sensors
- Weather stations
- Crop monitoring
- Automated irrigation

### Mobile App Development
- Native mobile apps
- Offline synchronization
- Push notifications
- GPS integration

### Advanced Blockchain Features
- Cross-chain compatibility
- Tokenization
- DeFi integration
- NFT support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Team

- **Backend Development**: Node.js, Express.js, PostgreSQL
- **Blockchain Development**: Solidity, Web3.js, Ethereum
- **Frontend Development**: HTML5, CSS3, JavaScript
- **AI/ML Integration**: Price prediction algorithms
- **Database Design**: PostgreSQL schema design
- **UI/UX Design**: Responsive web design

## 📞 Support

For support and questions:
- Email: support@agrisupplychain.com
- Documentation: [Project Wiki](https://github.com/agrisupplychain/wiki)
- Issues: [GitHub Issues](https://github.com/agrisupplychain/issues)

---

**Built with ❤️ for Indian Farmers** 🇮🇳

*Empowering farmers, ensuring transparency, building trust in agricultural supply chains.*