"""
Enhanced Market Data Service for Qlib Pro
Integrates real Australian market data with QLib models
"""

import os
import asyncio
import logging
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import requests
import yfinance as yf
from pathlib import Path
import json

# Alpha Vantage API for real-time data
ALPHA_VANTAGE_KEY = os.getenv("ALPHA_VANTAGE_KEY", "YR3O8FBCPDC5IVEX")

# Australian market configuration
ASX_SYMBOLS = [
    'CBA.AX', 'BHP.AX', 'CSL.AX', 'WBC.AX', 'ANZ.AX', 'TLS.AX', 'RIO.AX', 
    'WOW.AX', 'NAB.AX', 'FMG.AX', 'COL.AX', 'TCL.AX', 'STO.AX', 'QBE.AX',
    'MQG.AX', 'WES.AX', 'ALL.AX', 'IAG.AX', 'JHX.AX', 'REA.AX'
]

ASX_SECTORS = {
    'Financials': ['CBA.AX', 'WBC.AX', 'ANZ.AX', 'NAB.AX', 'MQG.AX', 'QBE.AX', 'ALL.AX', 'IAG.AX'],
    'Materials': ['BHP.AX', 'RIO.AX', 'FMG.AX', 'STO.AX'],
    'Healthcare': ['CSL.AX', 'COL.AX'],
    'Communication Services': ['TLS.AX', 'TCL.AX'],
    'Consumer Staples': ['WOW.AX', 'WES.AX'],
    'Real Estate': ['REA.AX', 'JHX.AX']
}

logger = logging.getLogger(__name__)

class MarketDataService:
    """Enhanced market data service with QLib integration"""
    
    def __init__(self):
        self.cache = {}
        self.cache_duration = 300  # 5 minutes cache
        self.data_dir = Path(__file__).parent / "market_data"
        self.data_dir.mkdir(exist_ok=True)
        
        # QLib data configuration
        self.qlib_symbols = {}
        self.initialize_qlib_symbols()
    
    def initialize_qlib_symbols(self):
        """Map ASX symbols to QLib format"""
        # For Chinese market integration, map ASX to similar Chinese stocks
        self.qlib_symbols = {
            'CBA.AX': '000001.SZ',  # Ping An Bank
            'BHP.AX': '600028.SH',  # China Petroleum
            'CSL.AX': '000858.SZ',  # Wuliangye (healthcare proxy)
            'WBC.AX': '600036.SH',  # China Merchants Bank
            'ANZ.AX': '600000.SH',  # Pudong Development Bank
            'TLS.AX': '000063.SZ',  # ZTE Corporation
            'RIO.AX': '600362.SH',  # Jiangxi Copper
            'WOW.AX': '000895.SZ',  # Shuanghui Development
            'NAB.AX': '002142.SZ',  # Bank of Ningbo
            'FMG.AX': '600019.SH'   # Baoshan Iron & Steel
        }
    
    async def get_realtime_quotes(self, symbols: List[str] = None) -> Dict[str, Any]:
        """Get real-time market quotes for ASX symbols"""
        if symbols is None:
            symbols = ASX_SYMBOLS[:10]  # Top 10 ASX stocks
        
        quotes = []
        
        for symbol in symbols:
            try:
                # Check cache first
                cache_key = f"quote_{symbol}"
                if self._is_cached(cache_key):
                    quotes.append(self.cache[cache_key]['data'])
                    continue
                
                # Try Alpha Vantage API
                quote = await self._fetch_alpha_vantage_quote(symbol)
                if quote:
                    self._cache_data(cache_key, quote)
                    quotes.append(quote)
                else:
                    # Fallback to Yahoo Finance
                    quote = await self._fetch_yahoo_quote(symbol)
                    if quote:
                        self._cache_data(cache_key, quote)
                        quotes.append(quote)
                    else:
                        # Generate mock data as last resort
                        quote = self._generate_mock_quote(symbol)
                        quotes.append(quote)
                        
            except Exception as e:
                logger.error(f"Error fetching quote for {symbol}: {e}")
                quotes.append(self._generate_mock_quote(symbol))
        
        return {
            'quotes': quotes,
            'total': len(quotes),
            'market': 'ASX',
            'timestamp': datetime.now().isoformat(),
            'market_status': await self._get_market_status()
        }
    
    async def _fetch_alpha_vantage_quote(self, symbol: str) -> Optional[Dict]:
        """Fetch quote from Alpha Vantage API"""
        try:
            url = "https://www.alphavantage.co/query"
            params = {
                'function': 'GLOBAL_QUOTE',
                'symbol': symbol,
                'apikey': ALPHA_VANTAGE_KEY
            }
            
            response = requests.get(url, params=params, timeout=10)
            data = response.json()
            
            if 'Global Quote' in data and data['Global Quote']:
                quote_data = data['Global Quote']
                return {
                    'symbol': symbol,
                    'company_name': self._get_company_name(symbol),
                    'price': float(quote_data.get('05. price', 0)),
                    'change': float(quote_data.get('09. change', 0)),
                    'change_percent': quote_data.get('10. change percent', '0%'),
                    'volume': int(float(quote_data.get('06. volume', 0))),
                    'high': float(quote_data.get('03. high', 0)),
                    'low': float(quote_data.get('04. low', 0)),
                    'open': float(quote_data.get('02. open', 0)),
                    'previous_close': float(quote_data.get('08. previous close', 0)),
                    'timestamp': quote_data.get('07. latest trading day', datetime.now().strftime('%Y-%m-%d')),
                    'source': 'alpha_vantage'
                }
        except Exception as e:
            logger.error(f"Alpha Vantage API error for {symbol}: {e}")
        
        return None
    
    async def _fetch_yahoo_quote(self, symbol: str) -> Optional[Dict]:
        """Fetch quote from Yahoo Finance"""
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            history = ticker.history(period="1d")
            
            if not history.empty:
                latest = history.iloc[-1]
                return {
                    'symbol': symbol,
                    'company_name': info.get('longName', self._get_company_name(symbol)),
                    'price': float(latest['Close']),
                    'change': float(latest['Close'] - latest['Open']),
                    'change_percent': f"{((latest['Close'] - latest['Open']) / latest['Open'] * 100):.2f}%",
                    'volume': int(latest['Volume']),
                    'high': float(latest['High']),
                    'low': float(latest['Low']),
                    'open': float(latest['Open']),
                    'previous_close': float(latest['Close']),
                    'timestamp': datetime.now().strftime('%Y-%m-%d'),
                    'source': 'yahoo_finance',
                    'market_cap': info.get('marketCap', 0),
                    'pe_ratio': info.get('trailingPE', 0)
                }
        except Exception as e:
            logger.error(f"Yahoo Finance error for {symbol}: {e}")
        
        return None
    
    def _generate_mock_quote(self, symbol: str) -> Dict:
        """Generate realistic mock quote data"""
        base_price = self._get_base_price(symbol)
        change_percent = np.random.normal(0, 0.02)  # 2% daily volatility
        change = base_price * change_percent
        current_price = base_price + change
        
        return {
            'symbol': symbol,
            'company_name': self._get_company_name(symbol),
            'price': round(current_price, 2),
            'change': round(change, 2),
            'change_percent': f"{change_percent * 100:.2f}%",
            'volume': np.random.randint(100000, 5000000),
            'high': round(current_price * 1.02, 2),
            'low': round(current_price * 0.98, 2),
            'open': round(base_price, 2),
            'previous_close': round(base_price, 2),
            'timestamp': datetime.now().strftime('%Y-%m-%d'),
            'source': 'mock'
        }
    
    async def get_historical_data(self, symbol: str, period: str = "1y") -> Dict[str, Any]:
        """Get historical price data for analysis"""
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period=period)
            
            if hist.empty:
                return self._generate_mock_historical(symbol, period)
            
            # Convert to list of dictionaries for JSON serialization
            data = []
            for date, row in hist.iterrows():
                data.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'open': float(row['Open']),
                    'high': float(row['High']),
                    'low': float(row['Low']),
                    'close': float(row['Close']),
                    'volume': int(row['Volume'])
                })
            
            return {
                'symbol': symbol,
                'period': period,
                'data': data,
                'count': len(data),
                'source': 'yahoo_finance'
            }
            
        except Exception as e:
            logger.error(f"Error fetching historical data for {symbol}: {e}")
            return self._generate_mock_historical(symbol, period)
    
    def _generate_mock_historical(self, symbol: str, period: str) -> Dict[str, Any]:
        """Generate mock historical data"""
        days = {'1d': 1, '5d': 5, '1mo': 30, '3mo': 90, '6mo': 180, '1y': 365, '2y': 730}
        num_days = days.get(period, 365)
        
        base_price = self._get_base_price(symbol)
        data = []
        current_price = base_price
        
        for i in range(num_days):
            date = datetime.now() - timedelta(days=num_days - i)
            
            # Random walk with mean reversion
            change = np.random.normal(0.001, 0.02)  # Small upward drift with volatility
            current_price *= (1 + change)
            
            # Generate OHLC data
            open_price = current_price * (1 + np.random.normal(0, 0.005))
            high_price = max(open_price, current_price) * (1 + abs(np.random.normal(0, 0.01)))
            low_price = min(open_price, current_price) * (1 - abs(np.random.normal(0, 0.01)))
            close_price = current_price
            volume = np.random.randint(100000, 2000000)
            
            data.append({
                'date': date.strftime('%Y-%m-%d'),
                'open': round(open_price, 2),
                'high': round(high_price, 2),
                'low': round(low_price, 2),
                'close': round(close_price, 2),
                'volume': volume
            })
        
        return {
            'symbol': symbol,
            'period': period,
            'data': data,
            'count': len(data),
            'source': 'mock'
        }
    
    async def get_market_indices(self) -> Dict[str, Any]:
        """Get Australian market indices data"""
        indices = ['^AXJO', '^AXKO', '^AXTO']  # ASX 200, ASX All Ordinaries, ASX Small Ordinaries
        index_data = []
        
        for index in indices:
            try:
                ticker = yf.Ticker(index)
                hist = ticker.history(period="1d")
                
                if not hist.empty:
                    latest = hist.iloc[-1]
                    previous = hist.iloc[-2] if len(hist) > 1 else latest
                    
                    index_data.append({
                        'symbol': index,
                        'name': self._get_index_name(index),
                        'value': float(latest['Close']),
                        'change': float(latest['Close'] - previous['Close']),
                        'change_percent': f"{((latest['Close'] - previous['Close']) / previous['Close'] * 100):.2f}%",
                        'timestamp': datetime.now().isoformat()
                    })
                else:
                    # Mock data for index
                    base_value = 7000 if index == '^AXJO' else 5000
                    change = np.random.normal(0, 50)
                    index_data.append({
                        'symbol': index,
                        'name': self._get_index_name(index),
                        'value': base_value + change,
                        'change': change,
                        'change_percent': f"{(change / base_value * 100):.2f}%",
                        'timestamp': datetime.now().isoformat()
                    })
                    
            except Exception as e:
                logger.error(f"Error fetching index data for {index}: {e}")
        
        return {
            'indices': index_data,
            'market': 'ASX',
            'timestamp': datetime.now().isoformat()
        }
    
    async def get_sector_performance(self) -> Dict[str, Any]:
        """Get sector performance data"""
        sector_data = []
        
        for sector, symbols in ASX_SECTORS.items():
            try:
                # Get performance for a few symbols from each sector
                sector_prices = []
                for symbol in symbols[:3]:  # Take first 3 symbols from each sector
                    quote = await self._fetch_yahoo_quote(symbol)
                    if quote:
                        change_percent = float(quote['change_percent'].replace('%', ''))
                        sector_prices.append(change_percent)
                
                if sector_prices:
                    avg_change = np.mean(sector_prices)
                    sector_data.append({
                        'sector': sector,
                        'change_percent': round(avg_change, 2),
                        'top_stocks': symbols[:3]
                    })
                else:
                    # Mock sector data
                    sector_data.append({
                        'sector': sector,
                        'change_percent': round(np.random.normal(0, 2), 2),
                        'top_stocks': symbols[:3]
                    })
                    
            except Exception as e:
                logger.error(f"Error calculating sector performance for {sector}: {e}")
        
        return {
            'sectors': sector_data,
            'timestamp': datetime.now().isoformat()
        }
    
    async def get_market_news(self, query: str = "ASX Australian stock market", limit: int = 10) -> Dict[str, Any]:
        """Get market news (mock implementation)"""
        # In production, integrate with news APIs like NewsAPI, Bloomberg, or Reuters
        mock_news = [
            {
                'title': 'ASX 200 gains 1.2% on banking sector strength',
                'summary': 'Major banks led the market higher with CBA and WBC posting strong gains.',
                'source': 'Financial Review',
                'timestamp': datetime.now().isoformat(),
                'url': '#',
                'sentiment': 'positive'
            },
            {
                'title': 'RBA maintains cash rate at 4.35%',
                'summary': 'Reserve Bank keeps rates on hold as inflation shows signs of moderating.',
                'source': 'ABC News',
                'timestamp': (datetime.now() - timedelta(hours=2)).isoformat(),
                'url': '#',
                'sentiment': 'neutral'
            },
            {
                'title': 'Mining stocks under pressure on China demand concerns',
                'summary': 'BHP and RIO slip as Chinese economic data disappoints investors.',
                'source': 'The Australian',
                'timestamp': (datetime.now() - timedelta(hours=4)).isoformat(),
                'url': '#',
                'sentiment': 'negative'
            }
        ]
        
        return {
            'news': mock_news[:limit],
            'query': query,
            'total': len(mock_news),
            'timestamp': datetime.now().isoformat()
        }
    
    async def _get_market_status(self) -> str:
        """Get current market status"""
        now = datetime.now()
        # ASX trading hours: 10:00 AM - 4:00 PM AEST
        market_open = now.replace(hour=10, minute=0, second=0, microsecond=0)
        market_close = now.replace(hour=16, minute=0, second=0, microsecond=0)
        
        if market_open <= now <= market_close and now.weekday() < 5:
            return "open"
        elif now.weekday() >= 5:
            return "closed_weekend"
        else:
            return "closed"
    
    def _get_company_name(self, symbol: str) -> str:
        """Get company name for symbol"""
        company_names = {
            'CBA.AX': 'Commonwealth Bank of Australia',
            'BHP.AX': 'BHP Group Limited',
            'CSL.AX': 'CSL Limited',
            'WBC.AX': 'Westpac Banking Corporation',
            'ANZ.AX': 'Australia and New Zealand Banking Group',
            'TLS.AX': 'Telstra Corporation Limited',
            'RIO.AX': 'Rio Tinto Limited',
            'WOW.AX': 'Woolworths Group Limited',
            'NAB.AX': 'National Australia Bank Limited',
            'FMG.AX': 'Fortescue Metals Group Limited'
        }
        return company_names.get(symbol, symbol.replace('.AX', ' Limited'))
    
    def _get_index_name(self, symbol: str) -> str:
        """Get index name for symbol"""
        index_names = {
            '^AXJO': 'ASX 200',
            '^AXKO': 'ASX All Ordinaries',
            '^AXTO': 'ASX Small Ordinaries'
        }
        return index_names.get(symbol, symbol)
    
    def _get_base_price(self, symbol: str) -> float:
        """Get realistic base price for symbol"""
        base_prices = {
            'CBA.AX': 110.50, 'BHP.AX': 45.20, 'CSL.AX': 295.50, 'WBC.AX': 25.20,
            'ANZ.AX': 27.30, 'TLS.AX': 4.05, 'RIO.AX': 124.30, 'WOW.AX': 37.80,
            'NAB.AX': 32.50, 'FMG.AX': 19.85
        }
        return base_prices.get(symbol, 50.0 + np.random.random() * 100)
    
    def _is_cached(self, key: str) -> bool:
        """Check if data is cached and still valid"""
        if key not in self.cache:
            return False
        
        cache_time = self.cache[key]['timestamp']
        return (datetime.now() - cache_time).seconds < self.cache_duration
    
    def _cache_data(self, key: str, data: Any):
        """Cache data with timestamp"""
        self.cache[key] = {
            'data': data,
            'timestamp': datetime.now()
        }

# Global service instance
market_data_service = MarketDataService()