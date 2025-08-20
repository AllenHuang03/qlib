# Real Market Data Setup Guide

## Why We Use Mock Data by Default

Real market data typically requires API keys and has usage limits:

### **Free Options**
- **Alpha Vantage**: 5 calls/minute, 500/day (free tier)
- **Yahoo Finance**: Unofficial, rate limited, may break
- **IEX Cloud**: 500,000 requests/month (free tier)

### **Paid Options**
- **Alpha Vantage Pro**: $49.99/month for real-time
- **Quandl/Nasdaq**: $50+/month
- **ASX Market Data**: $200+/month for official real-time feeds

## Enable Real Data (Alpha Vantage)

### 1. Get Free Alpha Vantage API Key
1. Go to https://www.alphavantage.co/support/#api-key
2. Sign up for free account
3. Get your API key (e.g., `ABC123XYZ`)

### 2. Set Environment Variable

**Railway Deployment:**
```bash
# In Railway dashboard, add environment variable:
ALPHA_VANTAGE_KEY=your_actual_api_key_here
```

**Local Development:**
```bash
# Windows
set ALPHA_VANTAGE_KEY=your_actual_api_key_here

# Mac/Linux
export ALPHA_VANTAGE_KEY=your_actual_api_key_here
```

### 3. Install Dependencies
```bash
pip install aiohttp yfinance requests pandas numpy
```

## How It Works

The system automatically detects if real data is available:

```python
# If ALPHA_VANTAGE_KEY is set and dependencies are installed
✅ Real market data service loaded
data_source: "Real Data (open/closed)"

# If not available
⚠️ Using mock data only
data_source: "Mock Data (Real data unavailable)"
```

## API Rate Limits

**Free Alpha Vantage:**
- 5 API calls per minute
- 500 API calls per day
- No real-time data (15-20 min delay)

**Our System:**
- 5-minute caching to stay within limits
- Automatic fallback to mock data if quota exceeded
- Realistic mock data based on actual ASX prices

## Data Sources Priority

1. **Alpha Vantage** (if API key available)
2. **Yahoo Finance** (backup)
3. **Mock Data** (fallback)

The frontend will show the data source in API responses:
```json
{
  "data_source": "Real Data (open)",
  "quotes": [...],
  "market_status": "open"
}
```

## Testing

Test real data integration:
```bash
# Check API logs
curl https://qlib-production.up.railway.app/api/market/quotes

# Look for data_source field:
# "Real Data (open)" = Working
# "Mock Data" = Using fallback
```