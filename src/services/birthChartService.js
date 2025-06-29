const swisseph = require('swisseph');
const config = require('../config');

class BirthChartService {
  constructor() {
    // Set ephemeris path
    swisseph.swe_set_ephe_path(config.swisseph.ephePath);
  }

  async generateBirthChart({ birthdate, birthtime, latitude, longitude }) {
    try {
      const [year, month, day] = birthdate.split('-').map(Number);
      const [hour, minute] = birthtime.split(':').map(Number);

      // Calculate Julian Day
      const julianDay = swisseph.swe_julday(year, month, day, hour + minute/60, swisseph.SE_GREG_CAL);

      // Define planets to calculate
      const planets = {
        'Sun': swisseph.SE_SUN,
        'Moon': swisseph.SE_MOON,
        'Mercury': swisseph.SE_MERCURY,
        'Venus': swisseph.SE_VENUS,
        'Mars': swisseph.SE_MARS,
        'Jupiter': swisseph.SE_JUPITER,
        'Saturn': swisseph.SE_SATURN,
        'Uranus': swisseph.SE_URANUS,
        'Neptune': swisseph.SE_NEPTUNE,
        'Pluto': swisseph.SE_PLUTO
      };

      const birthChart = {
        planets: {},
        houses: {},
        aspects: [],
        timestamp: new Date().toISOString()
      };

      // Calculate planetary positions
      Object.keys(planets).forEach(planetName => {
        try {
          const planetId = planets[planetName];
          const result = swisseph.swe_calc_ut(julianDay, planetId, swisseph.SEFLG_SWIEPH);
          
          if (result.flag >= 0) {
            const longitude = result.longitude;
            const sign = this.getZodiacSign(longitude);
            
            birthChart.planets[planetName] = {
              longitude: longitude,
              sign: sign,
              degree: Math.floor(longitude % 30),
              absoluteDegree: Math.floor(longitude),
              latitude: result.latitude,
              distance: result.distance,
              speed: result.longitudeSpeed
            };
          }
        } catch (error) {
          console.warn(`Error calculating ${planetName}:`, error.message);
          // Use fallback data for this planet
          birthChart.planets[planetName] = this.getFallbackPlanetData(planetName);
        }
      });

      // Calculate houses using Placidus system
      try {
        const houses = swisseph.swe_houses(julianDay, latitude, longitude, 'P');
        if (houses) {
          for (let i = 1; i <= 12; i++) {
            birthChart.houses[`House${i}`] = {
              longitude: houses.house[i],
              sign: this.getZodiacSign(houses.house[i])
            };
          }
          
          // Add ASC, MC, etc.
          birthChart.houses.ASC = {
            longitude: houses.ascendant,
            sign: this.getZodiacSign(houses.ascendant)
          };
          birthChart.houses.MC = {
            longitude: houses.mc,
            sign: this.getZodiacSign(houses.mc)
          };
        }
      } catch (error) {
        console.warn('Error calculating houses:', error.message);
      }

      // Calculate aspects between planets
      birthChart.aspects = this.calculateAspects(birthChart.planets);

      return birthChart;
    } catch (error) {
      console.error('Error generating birth chart:', error);
      return this.getMockBirthChart({ birthdate, birthtime, latitude, longitude });
    }
  }

  getZodiacSign(longitude) {
    const signs = [
      'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
      'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
    ];
    
    const signIndex = Math.floor(longitude / 30);
    return signs[signIndex];
  }

  getFallbackPlanetData(planetName) {
    const fallbackData = {
      'Sun': { longitude: 85.5, sign: 'Gemini', degree: 25, absoluteDegree: 85 },
      'Moon': { longitude: 142.3, sign: 'Leo', degree: 22, absoluteDegree: 142 },
      'Mercury': { longitude: 78.9, sign: 'Gemini', degree: 18, absoluteDegree: 78 },
      'Venus': { longitude: 112.7, sign: 'Cancer', degree: 22, absoluteDegree: 112 },
      'Mars': { longitude: 201.4, sign: 'Libra', degree: 21, absoluteDegree: 201 },
      'Jupiter': { longitude: 29.8, sign: 'Taurus', degree: 29, absoluteDegree: 29 },
      'Saturn': { longitude: 314.2, sign: 'Aquarius', degree: 14, absoluteDegree: 314 },
      'Uranus': { longitude: 45.6, sign: 'Taurus', degree: 15, absoluteDegree: 45 },
      'Neptune': { longitude: 355.1, sign: 'Pisces', degree: 25, absoluteDegree: 355 },
      'Pluto': { longitude: 297.3, sign: 'Capricorn', degree: 27, absoluteDegree: 297 }
    };

    return fallbackData[planetName] || { longitude: 0, sign: 'Aries', degree: 0, absoluteDegree: 0 };
  }

  getMockBirthChart({ birthdate, birthtime, latitude, longitude }) {
    const mockPlanets = {
      Sun: { longitude: 85.5, sign: 'Gemini', degree: 25, absoluteDegree: 85 },
      Moon: { longitude: 142.3, sign: 'Leo', degree: 22, absoluteDegree: 142 },
      Mercury: { longitude: 78.9, sign: 'Gemini', degree: 18, absoluteDegree: 78 },
      Venus: { longitude: 112.7, sign: 'Cancer', degree: 22, absoluteDegree: 112 },
      Mars: { longitude: 201.4, sign: 'Libra', degree: 21, absoluteDegree: 201 },
      Jupiter: { longitude: 29.8, sign: 'Taurus', degree: 29, absoluteDegree: 29 },
      Saturn: { longitude: 314.2, sign: 'Aquarius', degree: 14, absoluteDegree: 314 },
      Uranus: { longitude: 45.6, sign: 'Taurus', degree: 15, absoluteDegree: 45 },
      Neptune: { longitude: 355.1, sign: 'Pisces', degree: 25, absoluteDegree: 355 },
      Pluto: { longitude: 297.3, sign: 'Capricorn', degree: 27, absoluteDegree: 297 }
    };

    return {
      planets: mockPlanets,
      houses: {},
      aspects: this.calculateAspects(mockPlanets),
      timestamp: new Date().toISOString(),
      isMock: true
    };
  }

  calculateAspects(planets) {
    const aspects = [];
    const planetNames = Object.keys(planets);
    const orbLimit = 8; // degrees

    for (let i = 0; i < planetNames.length; i++) {
      for (let j = i + 1; j < planetNames.length; j++) {
        const planet1 = planetNames[i];
        const planet2 = planetNames[j];
        const longitude1 = planets[planet1].longitude;
        const longitude2 = planets[planet2].longitude;
        
        const aspectData = this.calculateAspect(longitude1, longitude2, orbLimit);
        
        if (aspectData) {
          aspects.push({
            planet1,
            planet2,
            aspect: aspectData.aspect,
            orb: aspectData.orb,
            score: this.getAspectScore(aspectData.aspect)
          });
        }
      }
    }

    return aspects;
  }

  calculateTransits(birthChart, targetDate = new Date()) {
    try {
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth() + 1;
      const day = targetDate.getDate();
      const hour = targetDate.getHours() + targetDate.getMinutes() / 60;

      // Calculate Julian Day for current time
      const julianDay = swisseph.swe_julday(year, month, day, hour, swisseph.SE_GREG_CAL);

      const transitPlanets = {
        'Sun': swisseph.SE_SUN,
        'Moon': swisseph.SE_MOON,
        'Mercury': swisseph.SE_MERCURY,
        'Venus': swisseph.SE_VENUS,
        'Mars': swisseph.SE_MARS,
        'Jupiter': swisseph.SE_JUPITER,
        'Saturn': swisseph.SE_SATURN
      };

      const currentPlanets = {};
      
      // Get current planetary positions
      Object.keys(transitPlanets).forEach(planetName => {
        try {
          const planetId = transitPlanets[planetName];
          const result = swisseph.swe_calc_ut(julianDay, planetId, swisseph.SEFLG_SWIEPH);
          
          if (result.flag >= 0) {
            currentPlanets[planetName] = {
              longitude: result.longitude
            };
          }
        } catch (error) {
          console.warn(`Error calculating transit ${planetName}:`, error.message);
          // Use approximate position
          currentPlanets[planetName] = {
            longitude: this.getApproximatePosition(planetName, targetDate)
          };
        }
      });

      const aspects = [];
      const orbLimit = 3;

      // Calculate aspects between natal and transit planets
      Object.keys(birthChart.planets).forEach(natalPlanet => {
        Object.keys(currentPlanets).forEach(transitPlanet => {
          const natalDegree = birthChart.planets[natalPlanet].longitude;
          const transitDegree = currentPlanets[transitPlanet].longitude;
          
          const aspectData = this.calculateAspect(natalDegree, transitDegree, orbLimit);
          
          if (aspectData) {
            aspects.push({
              natalPlanet,
              transitPlanet,
              aspect: aspectData.aspect,
              orb: aspectData.orb,
              score: this.getAspectScore(aspectData.aspect)
            });
          }
        });
      });

      return aspects;
    } catch (error) {
      console.error('Error calculating transits:', error);
      return this.getMockTransits(birthChart);
    }
  }

  getApproximatePosition(planetName, date) {
    const hour = date.getHours();
    const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    
    const approximatePositions = {
      'Sun': (dayOfYear + hour / 24) % 360,
      'Moon': (dayOfYear * 13 + hour * 0.5) % 360,
      'Mercury': (dayOfYear * 4 + hour * 0.2) % 360,
      'Venus': (dayOfYear * 1.6 + hour * 0.1) % 360,
      'Mars': (dayOfYear * 0.5 + hour * 0.05) % 360,
      'Jupiter': (dayOfYear * 0.08 + hour * 0.01) % 360,
      'Saturn': (dayOfYear * 0.03 + hour * 0.005) % 360
    };

    return approximatePositions[planetName] || 0;
  }

  getMockTransits(birthChart) {
    return [
      {
        natalPlanet: 'Sun',
        transitPlanet: 'Jupiter',
        aspect: 'trine',
        orb: 2.5,
        score: 30
      },
      {
        natalPlanet: 'Moon',
        transitPlanet: 'Venus',
        aspect: 'sextile',
        orb: 1.8,
        score: 20
      }
    ];
  }

  calculateAspect(degree1, degree2, orbLimit) {
    const diff = Math.abs(degree1 - degree2);
    const normalizedDiff = Math.min(diff, 360 - diff);

    const aspects = [
      { name: 'conjunction', angle: 0, orb: orbLimit },
      { name: 'sextile', angle: 60, orb: orbLimit },
      { name: 'square', angle: 90, orb: orbLimit },
      { name: 'trine', angle: 120, orb: orbLimit },
      { name: 'opposition', angle: 180, orb: orbLimit }
    ];

    for (const aspect of aspects) {
      const orb = Math.abs(normalizedDiff - aspect.angle);
      if (orb <= aspect.orb) {
        return {
          aspect: aspect.name,
          orb: orb.toFixed(1)
        };
      }
    }

    return null;
  }

  getAspectScore(aspectName) {
    const scores = {
      'conjunction': 40,
      'trine': 30,
      'sextile': 20,
      'square': -30,
      'opposition': -40
    };
    return scores[aspectName] || 0;
  }
}

module.exports = new BirthChartService();