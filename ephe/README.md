# Swiss Ephemeris Data Files

This directory should contain the Swiss Ephemeris data files required for accurate astronomical calculations.

## Required Files

## Birthchart image url
- https://horoscopes.astro-seek.com/horoscope-chart4def-700__radix_24-1-1989_13-00.png?fortune_asp=1&vertex_asp=1&chiron_asp=1&lilith_asp=1&uzel_asp=1&dum_1_new=207.84&dum_10_new=116.486&no_domy=&dum_1=207.84&dum_2=237.45&dum_3=266.77&dum_4=296.486&dum_5=327.334&dum_6=358.48&&p_slunce=303.68&p_luna=144.17&p_merkur=306.62&p_venuse=286.2&p_mars=32.44&p_jupiter=56.1&p_saturn=278.2&p_uran=273.05&p_neptun=280.76&p_pluto=225.02&p_uzel=336.586&p_lilith=178.24&p_chiron=92.49&p_fortune=7.34&p_spirit=48.338&&p_vertex=329.78&r_merkur=ANO&r_uzel=ANO&r_chiron=ANO&tolerance=1&tolerance_paral=1.2&nocache=15&&domy_cisla=0&barva_planet=0&barva_stupne=0&barva_pozadi=0&barva_domy=1&barva_vzduch=1&gif=1

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