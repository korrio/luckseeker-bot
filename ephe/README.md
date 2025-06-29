# Swiss Ephemeris Data Files

This directory should contain the Swiss Ephemeris data files required for accurate astronomical calculations.

## Required Files

Download the following files from https://www.astro.com/swisseph/ephe/:

### Essential Files (minimum required):
- `sepl_18.se1` - Planetary ephemeris for 1800-2399
- `semo_18.se1` - Moon ephemeris for 1800-2399

### Optional Files (for extended date ranges):
- `sepl_06.se1` - Planetary ephemeris for 600-1799
- `semo_06.se1` - Moon ephemeris for 600-1799
- `sepl_42.se1` - Planetary ephemeris for 2400-3000
- `semo_42.se1` - Moon ephemeris for 2400-3000

### Asteroid Files (optional):
- `ast0_06.se1` - Main asteroids 600-1799
- `ast0_18.se1` - Main asteroids 1800-2399
- `ast0_42.se1` - Main asteroids 2400-3000

## Installation

1. Download the required `.se1` files from the Swiss Ephemeris website
2. Place them in this `ephe` directory
3. The application will automatically use these files for calculations

## Fallback

If ephemeris files are not available, the application will:
1. Use approximate calculations for basic functionality
2. Display mock data with a warning
3. Still provide fortune telling features with reduced accuracy

## File Size

Note: These files are quite large (several MB each). For production deployment, consider:
- Using only essential files to reduce bundle size
- Downloading files on first use
- Using CDN hosting for ephemeris data