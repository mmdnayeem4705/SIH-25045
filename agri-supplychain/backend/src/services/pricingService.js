const axios = require('axios');
const { Crop, Transaction } = require('../models');

class PricingService {
  constructor() {
    this.marketDataAPI = process.env.MARKET_DATA_API || 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';
    this.weatherAPI = process.env.WEATHER_API || 'https://api.openweathermap.org/data/2.5/weather';
    this.weatherAPIKey = process.env.WEATHER_API_KEY;
    this.historicalDataCache = new Map();
    this.pricePredictionCache = new Map();
  }

  /**
   * AI-based price prediction using multiple factors
   * @param {Object} cropData - Crop information
   * @param {Object} marketData - Current market data
   * @param {Object} weatherData - Weather conditions
   * @returns {Object} Price prediction with confidence score
   */
  async predictPrice(cropData, marketData, weatherData) {
    try {
      const cacheKey = `${cropData.cropType}_${cropData.district}_${new Date().toDateString()}`;
      
      // Check cache first
      if (this.pricePredictionCache.has(cacheKey)) {
        return this.pricePredictionCache.get(cacheKey);
      }

      // Get historical data
      const historicalData = await this.getHistoricalPriceData(cropData);
      
      // Calculate base factors
      const basePrice = await this.calculateBasePrice(cropData, historicalData);
      const marketFactor = this.calculateMarketFactor(marketData, cropData);
      const weatherFactor = this.calculateWeatherFactor(weatherData, cropData);
      const qualityFactor = this.calculateQualityFactor(cropData);
      const demandFactor = await this.calculateDemandFactor(cropData);
      const seasonalityFactor = this.calculateSeasonalityFactor(cropData);

      // AI prediction using weighted factors
      const predictedPrice = this.calculatePredictedPrice({
        basePrice,
        marketFactor,
        weatherFactor,
        qualityFactor,
        demandFactor,
        seasonalityFactor
      });

      // Calculate confidence score
      const confidenceScore = this.calculateConfidenceScore({
        historicalData,
        marketData,
        weatherData,
        cropData
      });

      const prediction = {
        suggestedPrice: Math.round(predictedPrice * 100) / 100,
        basePrice: Math.round(basePrice * 100) / 100,
        factors: {
          market: marketFactor,
          weather: weatherFactor,
          quality: qualityFactor,
          demand: demandFactor,
          seasonality: seasonalityFactor
        },
        confidenceScore,
        reasoning: this.generateReasoning({
          basePrice,
          marketFactor,
          weatherFactor,
          qualityFactor,
          demandFactor,
          seasonalityFactor
        }),
        timestamp: new Date(),
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      };

      // Cache the prediction
      this.pricePredictionCache.set(cacheKey, prediction);
      
      return prediction;
    } catch (error) {
      console.error('Error in price prediction:', error);
      throw new Error('Failed to predict price');
    }
  }

  /**
   * Get historical price data for the crop
   */
  async getHistoricalPriceData(cropData) {
    try {
      const cacheKey = `historical_${cropData.cropType}_${cropData.district}`;
      
      if (this.historicalDataCache.has(cacheKey)) {
        return this.historicalDataCache.get(cacheKey);
      }

      // Get historical transactions for this crop type and district
      const historicalTransactions = await Transaction.findAll({
        where: {
          type: 'FARMER_TO_GOVT',
          status: 'COMPLETED',
          createdAt: {
            [require('sequelize').Op.gte]: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
          }
        },
        include: [{
          model: Crop,
          where: {
            cropType: cropData.cropType,
            location: {
              [require('sequelize').Op.like]: `%"district":"${cropData.district}"%`
            }
          }
        }],
        order: [['createdAt', 'DESC']],
        limit: 100
      });

      const historicalData = {
        averagePrice: 0,
        priceRange: { min: 0, max: 0 },
        trend: 'stable',
        volatility: 0,
        dataPoints: historicalTransactions.length
      };

      if (historicalTransactions.length > 0) {
        const prices = historicalTransactions.map(t => parseFloat(t.pricePerUnit));
        historicalData.averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        historicalData.priceRange.min = Math.min(...prices);
        historicalData.priceRange.max = Math.max(...prices);
        
        // Calculate trend
        if (historicalTransactions.length >= 2) {
          const recent = prices.slice(0, Math.floor(prices.length / 2));
          const older = prices.slice(Math.floor(prices.length / 2));
          const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
          const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
          
          if (recentAvg > olderAvg * 1.05) historicalData.trend = 'increasing';
          else if (recentAvg < olderAvg * 0.95) historicalData.trend = 'decreasing';
        }

        // Calculate volatility (standard deviation)
        const variance = prices.reduce((acc, price) => acc + Math.pow(price - historicalData.averagePrice, 2), 0) / prices.length;
        historicalData.volatility = Math.sqrt(variance);
      }

      this.historicalDataCache.set(cacheKey, historicalData);
      return historicalData;
    } catch (error) {
      console.error('Error getting historical data:', error);
      return {
        averagePrice: 0,
        priceRange: { min: 0, max: 0 },
        trend: 'stable',
        volatility: 0,
        dataPoints: 0
      };
    }
  }

  /**
   * Calculate base price from historical data
   */
  async calculateBasePrice(cropData, historicalData) {
    if (historicalData.dataPoints === 0) {
      // Use default prices if no historical data
      const defaultPrices = {
        'RICE': 25,
        'WHEAT': 20,
        'CORN': 18,
        'TOMATO': 30,
        'POTATO': 15,
        'ONION': 20,
        'SUGARCANE': 12,
        'COTTON': 35,
        'SOYBEAN': 22,
        'GROUNDNUT': 28,
        'SUNFLOWER': 32,
        'MILLET': 16,
        'BARLEY': 18
      };
      return defaultPrices[cropData.cropType] || 20;
    }

    return historicalData.averagePrice;
  }

  /**
   * Calculate market factor based on current market conditions
   */
  calculateMarketFactor(marketData, cropData) {
    if (!marketData || !marketData.currentPrice) return 1.0;

    const marketPrice = parseFloat(marketData.currentPrice);
    const basePrice = this.calculateBasePrice(cropData, { averagePrice: marketPrice });
    
    // Market factor: how current market price compares to base price
    const factor = marketPrice / basePrice;
    
    // Normalize factor between 0.8 and 1.2
    return Math.max(0.8, Math.min(1.2, factor));
  }

  /**
   * Calculate weather factor based on weather conditions
   */
  calculateWeatherFactor(weatherData, cropData) {
    if (!weatherData) return 1.0;

    let factor = 1.0;
    const temperature = weatherData.temperature || 25;
    const humidity = weatherData.humidity || 50;
    const rainfall = weatherData.rainfall || 0;

    // Temperature impact
    if (temperature > 35) factor *= 1.1; // Hot weather increases demand for certain crops
    else if (temperature < 10) factor *= 0.9; // Cold weather decreases demand

    // Humidity impact
    if (humidity > 80) factor *= 0.95; // High humidity affects storage
    else if (humidity < 30) factor *= 1.05; // Low humidity increases demand

    // Rainfall impact
    if (rainfall > 50) factor *= 0.9; // Heavy rainfall affects supply
    else if (rainfall < 5) factor *= 1.1; // Drought conditions increase prices

    return Math.max(0.7, Math.min(1.3, factor));
  }

  /**
   * Calculate quality factor based on crop quality
   */
  calculateQualityFactor(cropData) {
    const qualityGrades = {
      'A+': 1.2,
      'A': 1.1,
      'B+': 1.0,
      'B': 0.9,
      'C': 0.8
    };

    return qualityGrades[cropData.qualityGrade] || 1.0;
  }

  /**
   * Calculate demand factor based on recent transactions
   */
  async calculateDemandFactor(cropData) {
    try {
      const recentTransactions = await Transaction.count({
        where: {
          type: 'GOVT_TO_CUSTOMER',
          status: 'COMPLETED',
          createdAt: {
            [require('sequelize').Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        include: [{
          model: Crop,
          where: {
            cropType: cropData.cropType
          }
        }]
      });

      // Higher demand = higher factor
      if (recentTransactions > 50) return 1.2;
      else if (recentTransactions > 20) return 1.1;
      else if (recentTransactions > 5) return 1.0;
      else return 0.9;
    } catch (error) {
      console.error('Error calculating demand factor:', error);
      return 1.0;
    }
  }

  /**
   * Calculate seasonality factor based on crop type and current date
   */
  calculateSeasonalityFactor(cropData) {
    const month = new Date().getMonth() + 1;
    const seasonalityFactors = {
      'RICE': { 1: 1.2, 2: 1.1, 3: 1.0, 4: 0.9, 5: 0.8, 6: 0.9, 7: 1.0, 8: 1.1, 9: 1.2, 10: 1.3, 11: 1.2, 12: 1.1 },
      'WHEAT': { 1: 1.0, 2: 1.1, 3: 1.2, 4: 1.3, 5: 1.2, 6: 1.1, 7: 1.0, 8: 0.9, 9: 0.8, 10: 0.9, 11: 1.0, 12: 1.0 },
      'TOMATO': { 1: 1.3, 2: 1.2, 3: 1.1, 4: 1.0, 5: 0.9, 6: 0.8, 7: 0.9, 8: 1.0, 9: 1.1, 10: 1.2, 11: 1.3, 12: 1.3 },
      'POTATO': { 1: 1.1, 2: 1.0, 3: 0.9, 4: 0.8, 5: 0.9, 6: 1.0, 7: 1.1, 8: 1.2, 9: 1.3, 10: 1.2, 11: 1.1, 12: 1.1 }
    };

    return seasonalityFactors[cropData.cropType]?.[month] || 1.0;
  }

  /**
   * Calculate final predicted price using weighted factors
   */
  calculatePredictedPrice(factors) {
    const weights = {
      basePrice: 0.3,
      marketFactor: 0.25,
      weatherFactor: 0.15,
      qualityFactor: 0.15,
      demandFactor: 0.1,
      seasonalityFactor: 0.05
    };

    const weightedPrice = factors.basePrice * (
      weights.marketFactor * factors.marketFactor +
      weights.weatherFactor * factors.weatherFactor +
      weights.qualityFactor * factors.qualityFactor +
      weights.demandFactor * factors.demandFactor +
      weights.seasonalityFactor * factors.seasonalityFactor
    );

    return Math.max(0.1, weightedPrice); // Ensure minimum price
  }

  /**
   * Calculate confidence score for the prediction
   */
  calculateConfidenceScore(data) {
    let score = 0.5; // Base confidence

    // Historical data availability
    if (data.historicalData.dataPoints > 50) score += 0.2;
    else if (data.historicalData.dataPoints > 20) score += 0.1;

    // Market data availability
    if (data.marketData && data.marketData.currentPrice) score += 0.1;

    // Weather data availability
    if (data.weatherData && data.weatherData.temperature) score += 0.1;

    // Data freshness
    const dataAge = Date.now() - (data.timestamp || 0);
    if (dataAge < 24 * 60 * 60 * 1000) score += 0.1; // Less than 24 hours old

    return Math.min(1.0, Math.max(0.1, score));
  }

  /**
   * Generate human-readable reasoning for the price prediction
   */
  generateReasoning(factors) {
    const reasons = [];

    if (factors.marketFactor > 1.1) {
      reasons.push('Current market prices are higher than average');
    } else if (factors.marketFactor < 0.9) {
      reasons.push('Current market prices are lower than average');
    }

    if (factors.weatherFactor > 1.1) {
      reasons.push('Weather conditions favor higher prices');
    } else if (factors.weatherFactor < 0.9) {
      reasons.push('Weather conditions may reduce prices');
    }

    if (factors.qualityFactor > 1.1) {
      reasons.push('High quality grade increases value');
    } else if (factors.qualityFactor < 0.9) {
      reasons.push('Lower quality grade reduces value');
    }

    if (factors.demandFactor > 1.1) {
      reasons.push('High recent demand increases price');
    } else if (factors.demandFactor < 0.9) {
      reasons.push('Lower demand reduces price');
    }

    if (factors.seasonalityFactor > 1.1) {
      reasons.push('Seasonal factors favor higher prices');
    } else if (factors.seasonalityFactor < 0.9) {
      reasons.push('Seasonal factors reduce prices');
    }

    return reasons.length > 0 ? reasons.join('; ') : 'Price based on standard market conditions';
  }

  /**
   * Get current market data from external APIs
   */
  async getMarketData(cropType, district) {
    try {
      // This would integrate with real market data APIs
      // For now, return mock data
      return {
        currentPrice: 25 + Math.random() * 10,
        priceChange: (Math.random() - 0.5) * 5,
        volume: Math.floor(Math.random() * 1000),
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error fetching market data:', error);
      return null;
    }
  }

  /**
   * Get weather data for the region
   */
  async getWeatherData(latitude, longitude) {
    try {
      if (!this.weatherAPIKey) {
        // Return mock weather data if no API key
        return {
          temperature: 25 + Math.random() * 10,
          humidity: 50 + Math.random() * 30,
          rainfall: Math.random() * 20,
          timestamp: new Date()
        };
      }

      const response = await axios.get(this.weatherAPI, {
        params: {
          lat: latitude,
          lon: longitude,
          appid: this.weatherAPIKey,
          units: 'metric'
        }
      });

      return {
        temperature: response.data.main.temp,
        humidity: response.data.main.humidity,
        rainfall: response.data.rain?.['1h'] || 0,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error fetching weather data:', error);
      return null;
    }
  }

  /**
   * Clear cache (useful for testing or manual cache management)
   */
  clearCache() {
    this.historicalDataCache.clear();
    this.pricePredictionCache.clear();
  }
}

module.exports = new PricingService();
