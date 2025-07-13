const fs = require('fs').promises;
const path = require('path');

class Database {
  constructor() {
    this.dataDir = path.join(__dirname, '../../data');
    this.birthDataFile = path.join(this.dataDir, 'birthData.json');
    this.birthChartFile = path.join(this.dataDir, 'birthChart.json');
    this.additionalDataFile = path.join(this.dataDir, 'additionalData.json');
    this.fortuneCacheFile = path.join(this.dataDir, 'fortuneCache.json');
    this.quotaFile = path.join(this.dataDir, 'userQuota.json');
    
    this.initializeDatabase();
  }

  async initializeDatabase() {
    try {
      // Create data directory if it doesn't exist
      await fs.mkdir(this.dataDir, { recursive: true });
      
      // Initialize files if they don't exist
      await this.initializeFile(this.birthDataFile, {});
      await this.initializeFile(this.birthChartFile, {});
      await this.initializeFile(this.additionalDataFile, {
        lottery: {},
        business: {},
        partner: {},
        relocation: {}
      });
      await this.initializeFile(this.fortuneCacheFile, {});
      await this.initializeFile(this.quotaFile, {});
    } catch (error) {
      console.error('Error initializing database:', error);
    }
  }

  async initializeFile(filePath, defaultData) {
    try {
      await fs.access(filePath);
    } catch (error) {
      // File doesn't exist, create it
      await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2));
    }
  }

  async readFile(filePath) {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      return {};
    }
  }

  async writeFile(filePath, data) {
    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Error writing file ${filePath}:`, error);
    }
  }

  // Birth Data methods
  async getBirthData(userId) {
    const data = await this.readFile(this.birthDataFile);
    return data[userId] || null;
  }

  async setBirthData(userId, birthData) {
    const data = await this.readFile(this.birthDataFile);
    data[userId] = {
      ...birthData,
      timestamp: new Date().toISOString()
    };
    await this.writeFile(this.birthDataFile, data);
  }

  async deleteBirthData(userId) {
    const data = await this.readFile(this.birthDataFile);
    delete data[userId];
    await this.writeFile(this.birthDataFile, data);
  }

  // Birth Chart methods
  async getBirthChart(userId) {
    const data = await this.readFile(this.birthChartFile);
    return data[userId] || null;
  }

  async setBirthChart(userId, birthChart) {
    const data = await this.readFile(this.birthChartFile);
    data[userId] = {
      ...birthChart,
      timestamp: new Date().toISOString()
    };
    await this.writeFile(this.birthChartFile, data);
  }

  async deleteBirthChart(userId) {
    const data = await this.readFile(this.birthChartFile);
    delete data[userId];
    await this.writeFile(this.birthChartFile, data);
  }

  // Additional Data methods
  async getAdditionalData(userId, type) {
    const data = await this.readFile(this.additionalDataFile);
    return data[type]?.[userId] || null;
  }

  async setAdditionalData(userId, type, additionalData) {
    const data = await this.readFile(this.additionalDataFile);
    if (!data[type]) {
      data[type] = {};
    }
    data[type][userId] = {
      ...additionalData,
      timestamp: new Date().toISOString()
    };
    await this.writeFile(this.additionalDataFile, data);
  }

  async deleteAdditionalData(userId, type) {
    const data = await this.readFile(this.additionalDataFile);
    if (data[type]) {
      delete data[type][userId];
      await this.writeFile(this.additionalDataFile, data);
    }
  }

  // Helper method to get all additional data for a user
  async getAllAdditionalData(userId) {
    const data = await this.readFile(this.additionalDataFile);
    return {
      lotteryData: data.lottery?.[userId] || null,
      businessData: data.business?.[userId] || null,
      partnerData: data.partner?.[userId] || null,
      relocationData: data.relocation?.[userId] || null
    };
  }

  // Fortune Cache methods
  generateCacheKey(userId, category, birthChart, additionalData) {
    // Create a hash key based on user data, category and relevant data
    const keyData = {
      userId,
      category,
      birthChartTimestamp: birthChart.timestamp,
      additionalDataTimestamp: this.getRelevantAdditionalDataTimestamp(category, additionalData)
    };
    return Buffer.from(JSON.stringify(keyData)).toString('base64');
  }

  getRelevantAdditionalDataTimestamp(category, additionalData) {
    // Get timestamp of relevant additional data based on category
    switch (category) {
      case 'ซื้อหวย':
        return additionalData.lotteryData?.timestamp || null;
      case 'ดวงธุรกิจ':
        return additionalData.businessData?.timestamp || null;
      case 'พบรัก':
        return additionalData.partnerData?.timestamp || null;
      case 'ย้ายงาน':
        return additionalData.relocationData?.timestamp || null;
      default:
        return null;
    }
  }

  async getFortuneCache(cacheKey) {
    const cache = await this.readFile(this.fortuneCacheFile);
    return cache[cacheKey] || null;
  }

  async setFortuneCache(cacheKey, fortuneResult, category, additionalData) {
    const cache = await this.readFile(this.fortuneCacheFile);
    
    // Get analysis date/time from additional data
    const analysisDateTime = this.getAnalysisDateTime(category, additionalData);
    
    cache[cacheKey] = {
      result: fortuneResult,
      category,
      analysisDateTime,
      timestamp: new Date().toISOString()
    };
    
    await this.writeFile(this.fortuneCacheFile, cache);
  }

  getAnalysisDateTime(category, additionalData) {
    // Extract date/time from relevant additional data
    switch (category) {
      case 'ซื้อหวย':
        if (additionalData.lotteryData) {
          return {
            date: additionalData.lotteryData.date,
            time: additionalData.lotteryData.time,
            type: 'ซื้อหวย'
          };
        }
        break;
      case 'ดวงธุรกิจ':
        if (additionalData.businessData) {
          return {
            date: additionalData.businessData.date,
            time: additionalData.businessData.time,
            type: 'ดวงธุรกิจ'
          };
        }
        break;
      case 'พบรัก':
        if (additionalData.partnerData) {
          return {
            date: additionalData.partnerData.meetingDate || 'ไม่ระบุ',
            time: 'ไม่ระบุ',
            type: 'พบรัก'
          };
        }
        break;
      case 'ย้ายงาน':
        if (additionalData.relocationData) {
          return {
            date: additionalData.relocationData.date,
            time: 'ไม่ระบุ',
            type: 'ย้ายงาน'
          };
        }
        break;
    }
    
    return {
      date: 'ไม่ระบุ',
      time: 'ไม่ระบุ',
      type: category
    };
  }

  async deleteUserFortuneCache(userId) {
    const cache = await this.readFile(this.fortuneCacheFile);
    
    // Find and delete all cache entries for this user
    const keysToDelete = [];
    for (const [cacheKey, cacheData] of Object.entries(cache)) {
      try {
        // Decode the cache key to check if it belongs to this user
        const keyData = JSON.parse(Buffer.from(cacheKey, 'base64').toString());
        if (keyData.userId === userId) {
          keysToDelete.push(cacheKey);
        }
      } catch (error) {
        // Skip invalid cache keys
        console.warn('Invalid cache key format:', cacheKey);
      }
    }
    
    // Delete all matching cache entries
    keysToDelete.forEach(key => {
      delete cache[key];
    });
    
    if (keysToDelete.length > 0) {
      await this.writeFile(this.fortuneCacheFile, cache);
      console.log(`Deleted ${keysToDelete.length} fortune cache entries for user ${userId}`);
    }
  }

  // Cleanup old data (optional - removes data older than specified days)
  async cleanupOldData(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    try {
      // Clean birth data
      const birthData = await this.readFile(this.birthDataFile);
      let cleaned = false;
      for (const userId in birthData) {
        if (new Date(birthData[userId].timestamp) < cutoffDate) {
          delete birthData[userId];
          cleaned = true;
        }
      }
      if (cleaned) {
        await this.writeFile(this.birthDataFile, birthData);
      }

      // Clean birth chart data
      const birthChart = await this.readFile(this.birthChartFile);
      cleaned = false;
      for (const userId in birthChart) {
        if (new Date(birthChart[userId].timestamp) < cutoffDate) {
          delete birthChart[userId];
          cleaned = true;
        }
      }
      if (cleaned) {
        await this.writeFile(this.birthChartFile, birthChart);
      }

      // Clean additional data
      const additionalData = await this.readFile(this.additionalDataFile);
      cleaned = false;
      for (const type in additionalData) {
        for (const userId in additionalData[type]) {
          if (new Date(additionalData[type][userId].timestamp) < cutoffDate) {
            delete additionalData[type][userId];
            cleaned = true;
          }
        }
      }
      if (cleaned) {
        await this.writeFile(this.additionalDataFile, additionalData);
      }

      console.log(`Cleaned up data older than ${daysOld} days`);
    } catch (error) {
      console.error('Error cleaning up old data:', error);
    }
  }

  // Quota management methods
  async getUserQuota(userId) {
    const quotaData = await this.readFile(this.quotaFile);
    if (!quotaData[userId]) {
      // Initialize new user with 10 queries
      quotaData[userId] = {
        remainingQueries: 10,
        totalQueries: 10,
        usedQueries: 0,
        lastUpdated: new Date().toISOString(),
        resetDate: null
      };
      await this.writeFile(this.quotaFile, quotaData);
    }
    return quotaData[userId];
  }

  async decrementUserQuota(userId) {
    const quotaData = await this.readFile(this.quotaFile);
    
    if (!quotaData[userId]) {
      quotaData[userId] = {
        remainingQueries: 10,
        totalQueries: 10,
        usedQueries: 0,
        lastUpdated: new Date().toISOString(),
        resetDate: null
      };
    }

    if (quotaData[userId].remainingQueries > 0) {
      quotaData[userId].remainingQueries--;
      quotaData[userId].usedQueries++;
      quotaData[userId].lastUpdated = new Date().toISOString();
      
      await this.writeFile(this.quotaFile, quotaData);
      return true; // Success
    }
    
    return false; // No remaining quota
  }

  async checkUserQuota(userId) {
    const quota = await this.getUserQuota(userId);
    return quota.remainingQueries > 0;
  }

  async addUserQuota(userId, additionalQueries = 10) {
    const quotaData = await this.readFile(this.quotaFile);
    
    if (!quotaData[userId]) {
      quotaData[userId] = {
        remainingQueries: additionalQueries,
        totalQueries: additionalQueries,
        usedQueries: 0,
        lastUpdated: new Date().toISOString(),
        resetDate: null
      };
    } else {
      quotaData[userId].remainingQueries += additionalQueries;
      quotaData[userId].totalQueries += additionalQueries;
      quotaData[userId].lastUpdated = new Date().toISOString();
    }
    
    await this.writeFile(this.quotaFile, quotaData);
    return quotaData[userId];
  }

  async resetUserQuota(userId, newQuotaAmount = 10) {
    const quotaData = await this.readFile(this.quotaFile);
    
    quotaData[userId] = {
      remainingQueries: newQuotaAmount,
      totalQueries: newQuotaAmount,
      usedQueries: 0,
      lastUpdated: new Date().toISOString(),
      resetDate: new Date().toISOString()
    };
    
    await this.writeFile(this.quotaFile, quotaData);
    return quotaData[userId];
  }

  async getAllUserQuotas() {
    return await this.readFile(this.quotaFile);
  }

  // Check if user is first-time user (no data in any system)
  async isFirstTimeUser(userId) {
    const birthData = await this.getBirthData(userId);
    const birthChart = await this.getBirthChart(userId);
    const quotaData = await this.readFile(this.quotaFile);
    
    // User is first-time if they have no birth data, no birth chart, and no quota record
    return !birthData && !birthChart && !quotaData[userId];
  }

  // Mark user as visited (create initial quota record)
  async markUserAsVisited(userId) {
    const quotaData = await this.readFile(this.quotaFile);
    
    if (!quotaData[userId]) {
      quotaData[userId] = {
        remainingQueries: 10,
        totalQueries: 10,
        usedQueries: 0,
        lastUpdated: new Date().toISOString(),
        resetDate: null,
        firstVisit: new Date().toISOString()
      };
      await this.writeFile(this.quotaFile, quotaData);
    }
    
    return quotaData[userId];
  }
}

// Export singleton instance
module.exports = new Database();