const fs = require('fs').promises;
const path = require('path');

class Database {
  constructor() {
    this.dataDir = path.join(__dirname, '../../data');
    this.birthDataFile = path.join(this.dataDir, 'birthData.json');
    this.birthChartFile = path.join(this.dataDir, 'birthChart.json');
    this.additionalDataFile = path.join(this.dataDir, 'additionalData.json');
    
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
}

// Export singleton instance
module.exports = new Database();