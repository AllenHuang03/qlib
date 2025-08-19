"""
Australian Market Feature Engineering Pipeline
Specialized feature engineering for ASX and Australian market characteristics
"""

import os
import asyncio
import logging
import pandas as pd
import numpy as np
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from pathlib import Path
import pytz
import calendar

# Market data integration
try:
    from enhanced_market_data_service import enhanced_market_data_service
    MARKET_DATA_AVAILABLE = True
except ImportError:
    MARKET_DATA_AVAILABLE = False

# Database integration
try:
    from supabase_service import supabase_service
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False

logger = logging.getLogger(__name__)

# ================================
# AUSTRALIAN MARKET CONSTANTS
# ================================

# ASX Market Structure
ASX_SECTORS = {
    'XEJ': {  # Energy
        'name': 'Energy',
        'stocks': ['STO.AX', 'OSH.AX', 'WPL.AX', 'ORG.AX', 'BPT.AX'],
        'characteristics': ['commodity_sensitive', 'cyclical']
    },
    'XMJ': {  # Materials
        'name': 'Materials',
        'stocks': ['BHP.AX', 'RIO.AX', 'FMG.AX', 'NCM.AX', 'S32.AX', 'MIN.AX', 'IGO.AX'],
        'characteristics': ['commodity_sensitive', 'china_exposed', 'cyclical']
    },
    'XIJ': {  # Industrials
        'name': 'Industrials',
        'stocks': ['CSL.AX', 'WES.AX', 'TCL.AX', 'QAN.AX', 'ASX.AX', 'REH.AX'],
        'characteristics': ['defensive', 'domestic_focused']
    },
    'XDJ': {  # Consumer Discretionary
        'name': 'Consumer Discretionary',
        'stocks': ['JBH.AX', 'HVN.AX', 'SUL.AX', 'PMV.AX', 'DMP.AX'],
        'characteristics': ['consumer_dependent', 'cyclical']
    },
    'XSJ': {  # Consumer Staples
        'name': 'Consumer Staples',
        'stocks': ['WOW.AX', 'COL.AX', 'IGA.AX'],
        'characteristics': ['defensive', 'stable_earnings']
    },
    'XHJ': {  # Healthcare
        'name': 'Healthcare',
        'stocks': ['CSL.AX', 'COH.AX', 'SHL.AX', 'RHC.AX', 'PME.AX'],
        'characteristics': ['defensive', 'export_focused', 'innovation_driven']
    },
    'XFJ': {  # Financials
        'name': 'Financials',
        'stocks': ['CBA.AX', 'WBC.AX', 'ANZ.AX', 'NAB.AX', 'MQG.AX', 'QBE.AX', 'SUN.AX'],
        'characteristics': ['interest_rate_sensitive', 'housing_exposed', 'dividend_focused']
    },
    'XTJ': {  # Information Technology
        'name': 'Information Technology',
        'stocks': ['XRO.AX', 'APT.AX', 'ZIP.AX', 'TNE.AX', 'NXT.AX'],
        'characteristics': ['growth_focused', 'innovation_driven', 'volatile']
    },
    'XUJ': {  # Communication Services
        'name': 'Communication Services',
        'stocks': ['TLS.AX', 'TPG.AX', 'NWS.AX'],
        'characteristics': ['utility_like', 'regulated']
    },
    'XUJ_UTIL': {  # Utilities
        'name': 'Utilities',
        'stocks': ['AGL.AX', 'ORG.AX', 'APA.AX'],
        'characteristics': ['defensive', 'yield_focused', 'regulated']
    },
    'XRJ': {  # Real Estate
        'name': 'Real Estate',
        'stocks': ['SCG.AX', 'GMG.AX', 'VCX.AX', 'BWP.AX', 'CQR.AX'],
        'characteristics': ['interest_rate_sensitive', 'yield_focused']
    }
}

# Australian economic indicators
AU_ECONOMIC_INDICATORS = {
    'rba_rates': 'Reserve Bank of Australia Cash Rate',
    'employment': 'Australian Employment Data',
    'inflation': 'Consumer Price Index',
    'retail_sales': 'Australian Retail Sales',
    'house_prices': 'Australian House Price Index',
    'commodity_prices': 'Iron Ore, Coal, Gold Prices',
    'aud_trade_weighted': 'AUD Trade Weighted Index',
    'business_confidence': 'Australian Business Confidence'
}

# Trading calendar
ASX_HOLIDAYS = [
    'New Year\'s Day', 'Australia Day', 'Good Friday', 'Easter Monday',
    'Anzac Day', 'Queen\'s Birthday', 'Christmas Day', 'Boxing Day'
]

# Market hours (AEDT/AEST)
ASX_MARKET_HOURS = {
    'pre_open': '07:00',
    'opening_auction': '10:00',
    'continuous_trading': '10:00-16:00',
    'closing_auction': '16:10',
    'post_market': '16:12-17:00'
}

# ================================
# DATA CLASSES
# ================================

@dataclass
class AustralianMarketFeatures:
    """Container for Australian market specific features"""
    # Sector features
    sector_momentum: Dict[str, float]
    sector_relative_strength: Dict[str, float]
    sector_concentration: Dict[str, float]
    
    # Currency features
    aud_strength: float
    aud_volatility: float
    currency_carry: float
    
    # Economic features
    rba_rate_sensitivity: float
    commodity_exposure: float
    housing_exposure: float
    export_dependency: float
    
    # Market structure features
    asx200_weight: float
    free_float_adjusted: float
    franking_yield: float
    dividend_consistency: float
    
    # Trading features
    session_volume_profile: Dict[str, float]
    cross_listing_premium: float
    market_maker_presence: float
    
    # Seasonal features
    financial_year_effect: float
    reporting_season_impact: float
    resource_seasonality: float

@dataclass 
class FeatureEngineeredDataset:
    """Complete feature-engineered dataset for Australian markets"""
    features: pd.DataFrame
    labels: pd.DataFrame
    metadata: Dict[str, Any]
    feature_descriptions: Dict[str, str]
    australian_features: AustralianMarketFeatures
    validation_scores: Dict[str, float]

# ================================
# FEATURE ENGINEERING CLASS
# ================================

class AustralianMarketFeatureEngineer:
    """Comprehensive feature engineering pipeline for Australian markets"""
    
    def __init__(self):
        self.sydney_tz = pytz.timezone('Australia/Sydney')
        self.feature_cache = {}
        self.economic_data_cache = {}
        
        # Initialize market structure data
        self._load_market_structure()
        
        logger.info("Australian Market Feature Engineer initialized")
    
    def _load_market_structure(self):
        """Load ASX market structure and sector mappings"""
        self.sector_mappings = {}
        self.market_cap_tiers = {}
        
        # Build reverse mapping from stock to sector
        for sector_code, sector_info in ASX_SECTORS.items():
            for stock in sector_info['stocks']:
                self.sector_mappings[stock] = {
                    'sector_code': sector_code,
                    'sector_name': sector_info['name'],
                    'characteristics': sector_info['characteristics']
                }
    
    async def engineer_features(self, 
                              raw_data: pd.DataFrame,
                              symbols: List[str],
                              start_date: str,
                              end_date: str) -> FeatureEngineeredDataset:
        """Main feature engineering pipeline"""
        try:
            logger.info(f"Starting feature engineering for {len(symbols)} symbols")
            
            # Step 1: Basic technical features (Alpha158/Alpha360 style)
            basic_features = await self._generate_basic_features(raw_data)
            
            # Step 2: Australian market specific features
            au_features = await self._generate_australian_features(raw_data, symbols)
            
            # Step 3: Sector-based features
            sector_features = await self._generate_sector_features(raw_data, symbols)
            
            # Step 4: Currency and commodity features
            currency_features = await self._generate_currency_features(raw_data, start_date, end_date)
            
            # Step 5: Economic indicator features
            economic_features = await self._generate_economic_features(raw_data, start_date, end_date)
            
            # Step 6: Market microstructure features
            microstructure_features = await self._generate_microstructure_features(raw_data)
            
            # Step 7: Seasonal and calendar features
            seasonal_features = await self._generate_seasonal_features(raw_data)
            
            # Step 8: Risk and volatility features
            risk_features = await self._generate_risk_features(raw_data)
            
            # Combine all features
            combined_features = pd.concat([
                basic_features,
                au_features,
                sector_features,
                currency_features,
                economic_features,
                microstructure_features,
                seasonal_features,
                risk_features
            ], axis=1)
            
            # Generate labels (forward returns)
            labels = await self._generate_labels(raw_data)
            
            # Validate features
            validation_scores = await self._validate_features(combined_features, labels)
            
            # Create metadata
            metadata = {
                'total_features': len(combined_features.columns),
                'symbols': symbols,
                'start_date': start_date,
                'end_date': end_date,
                'creation_timestamp': datetime.now().isoformat(),
                'feature_groups': {
                    'basic': len(basic_features.columns),
                    'australian_specific': len(au_features.columns),
                    'sector': len(sector_features.columns),
                    'currency': len(currency_features.columns),
                    'economic': len(economic_features.columns),
                    'microstructure': len(microstructure_features.columns),
                    'seasonal': len(seasonal_features.columns),
                    'risk': len(risk_features.columns)
                }
            }
            
            # Feature descriptions
            feature_descriptions = self._generate_feature_descriptions(combined_features.columns)
            
            # Create Australian market features summary
            australian_features_summary = AustralianMarketFeatures(
                sector_momentum=self._calculate_sector_momentum(sector_features),
                sector_relative_strength=self._calculate_sector_relative_strength(sector_features),
                sector_concentration=self._calculate_sector_concentration(symbols),
                aud_strength=currency_features.get('aud_strength', 0.0).mean() if 'aud_strength' in currency_features.columns else 0.0,
                aud_volatility=currency_features.get('aud_volatility', 0.0).mean() if 'aud_volatility' in currency_features.columns else 0.0,
                currency_carry=currency_features.get('currency_carry', 0.0).mean() if 'currency_carry' in currency_features.columns else 0.0,
                rba_rate_sensitivity=economic_features.get('rba_sensitivity', 0.0).mean() if 'rba_sensitivity' in economic_features.columns else 0.0,
                commodity_exposure=self._calculate_commodity_exposure(symbols),
                housing_exposure=self._calculate_housing_exposure(symbols),
                export_dependency=self._calculate_export_dependency(symbols),
                asx200_weight=0.0,  # Would be calculated from actual index weights
                free_float_adjusted=0.0,
                franking_yield=0.0,
                dividend_consistency=0.0,
                session_volume_profile={},
                cross_listing_premium=0.0,
                market_maker_presence=0.0,
                financial_year_effect=seasonal_features.get('financial_year_effect', 0.0).mean() if 'financial_year_effect' in seasonal_features.columns else 0.0,
                reporting_season_impact=seasonal_features.get('reporting_season_impact', 0.0).mean() if 'reporting_season_impact' in seasonal_features.columns else 0.0,
                resource_seasonality=seasonal_features.get('resource_seasonality', 0.0).mean() if 'resource_seasonality' in seasonal_features.columns else 0.0
            )
            
            logger.info(f"Feature engineering completed: {len(combined_features.columns)} features generated")
            
            return FeatureEngineeredDataset(
                features=combined_features,
                labels=labels,
                metadata=metadata,
                feature_descriptions=feature_descriptions,
                australian_features=australian_features_summary,
                validation_scores=validation_scores
            )
            
        except Exception as e:
            logger.error(f"Feature engineering failed: {e}")
            raise
    
    async def _generate_basic_features(self, data: pd.DataFrame) -> pd.DataFrame:
        """Generate basic technical analysis features (Alpha158 style)"""
        features = {}
        
        try:
            # Price-based features
            features['returns_1d'] = data['close'].pct_change(1)
            features['returns_5d'] = data['close'].pct_change(5)
            features['returns_20d'] = data['close'].pct_change(20)
            
            # Moving averages
            features['ma_5'] = data['close'].rolling(5).mean()
            features['ma_10'] = data['close'].rolling(10).mean()
            features['ma_20'] = data['close'].rolling(20).mean()
            features['ma_50'] = data['close'].rolling(50).mean()
            
            # Moving average ratios
            features['ma_ratio_5_20'] = features['ma_5'] / features['ma_20']
            features['ma_ratio_10_50'] = features['ma_10'] / features['ma_50']
            
            # Volatility features
            features['volatility_5d'] = features['returns_1d'].rolling(5).std()
            features['volatility_20d'] = features['returns_1d'].rolling(20).std()
            features['volatility_60d'] = features['returns_1d'].rolling(60).std()
            
            # Volume features
            features['volume_ma_10'] = data['volume'].rolling(10).mean()
            features['volume_ratio'] = data['volume'] / features['volume_ma_10']
            features['dollar_volume'] = data['close'] * data['volume']
            
            # Price position features
            features['high_low_ratio'] = data['high'] / data['low']
            features['close_position'] = (data['close'] - data['low']) / (data['high'] - data['low'])
            
            # RSI
            features['rsi_14'] = self._calculate_rsi(data['close'], 14)
            
            # MACD
            macd_line, macd_signal, macd_histogram = self._calculate_macd(data['close'])
            features['macd'] = macd_line
            features['macd_signal'] = macd_signal
            features['macd_histogram'] = macd_histogram
            
            # Bollinger Bands
            bb_upper, bb_middle, bb_lower = self._calculate_bollinger_bands(data['close'], 20, 2)
            features['bb_position'] = (data['close'] - bb_lower) / (bb_upper - bb_lower)
            features['bb_width'] = (bb_upper - bb_lower) / bb_middle
            
            return pd.DataFrame(features, index=data.index)
            
        except Exception as e:
            logger.error(f"Basic feature generation failed: {e}")
            return pd.DataFrame(index=data.index)
    
    async def _generate_australian_features(self, data: pd.DataFrame, symbols: List[str]) -> pd.DataFrame:
        """Generate Australia-specific market features"""
        features = {}
        
        try:
            # ASX200 exposure
            asx200_symbols = self._get_asx200_symbols()
            features['is_asx200'] = [1 if symbol in asx200_symbols else 0 for symbol in symbols]
            
            # Market cap tier (based on ASX classifications)
            features['market_cap_tier'] = [self._get_market_cap_tier(symbol) for symbol in symbols]
            
            # Dividend features (Australian companies typically pay twice yearly)
            features['dividend_season_proximity'] = self._calculate_dividend_season_proximity(data.index)
            features['franking_benefit'] = [self._get_franking_benefit(symbol) for symbol in symbols]
            
            # Australian market hours trading intensity
            if 'hour' in data.index.names or hasattr(data.index, 'hour'):
                features['trading_session'] = self._get_trading_session(data.index)
                features['session_volume_profile'] = self._calculate_session_volume_profile(data)
            
            # Resources vs non-resources classification
            features['is_resources'] = [self._is_resources_stock(symbol) for symbol in symbols]
            features['china_trade_exposure'] = [self._get_china_trade_exposure(symbol) for symbol in symbols]
            
            # Banking sector specific (major part of ASX)
            features['is_big4_bank'] = [self._is_big4_bank(symbol) for symbol in symbols]
            
            return pd.DataFrame(features, index=data.index)
            
        except Exception as e:
            logger.error(f"Australian features generation failed: {e}")
            return pd.DataFrame(index=data.index)
    
    async def _generate_sector_features(self, data: pd.DataFrame, symbols: List[str]) -> pd.DataFrame:
        """Generate sector-based features"""
        features = {}
        
        try:
            # Get sector performance for each symbol
            for symbol in symbols:
                sector_info = self.sector_mappings.get(symbol)
                if sector_info:
                    sector_code = sector_info['sector_code']
                    
                    # Sector relative performance
                    features[f'{symbol}_sector_rel_perf'] = self._calculate_sector_relative_performance(
                        data, symbol, sector_code
                    )
                    
                    # Sector momentum
                    features[f'{symbol}_sector_momentum'] = self._calculate_sector_momentum_individual(
                        data, sector_code
                    )
                    
                    # Sector volatility
                    features[f'{symbol}_sector_volatility'] = self._calculate_sector_volatility(
                        data, sector_code
                    )
            
            # Cross-sector features
            features['sector_rotation_signal'] = self._calculate_sector_rotation_signal(data, symbols)
            features['defensive_vs_cyclical'] = self._calculate_defensive_cyclical_ratio(data, symbols)
            features['export_vs_domestic'] = self._calculate_export_domestic_ratio(data, symbols)
            
            return pd.DataFrame(features, index=data.index)
            
        except Exception as e:
            logger.error(f"Sector features generation failed: {e}")
            return pd.DataFrame(index=data.index)
    
    async def _generate_currency_features(self, data: pd.DataFrame, 
                                        start_date: str, end_date: str) -> pd.DataFrame:
        """Generate currency and FX-related features"""
        features = {}
        
        try:
            # AUD strength indicators (mock implementation)
            # In production, would fetch real FX data
            features['aud_usd_return'] = np.random.normal(0, 0.01, len(data))
            features['aud_strength'] = np.random.normal(0, 0.02, len(data))
            features['aud_volatility'] = np.random.uniform(0.08, 0.15, len(data))
            
            # Trade-weighted index
            features['aud_twi'] = np.random.normal(0, 0.015, len(data))
            
            # Currency carry trade indicators
            features['currency_carry'] = np.random.normal(0.02, 0.005, len(data))
            
            # Major trading partner currencies
            features['aud_cny_return'] = np.random.normal(0, 0.012, len(data))  # China
            features['aud_jpy_return'] = np.random.normal(0, 0.011, len(data))  # Japan
            features['aud_eur_return'] = np.random.normal(0, 0.010, len(data))  # Europe
            
            # Commodity currency correlation
            features['commodity_currency_factor'] = self._calculate_commodity_currency_factor(data)
            
            return pd.DataFrame(features, index=data.index)
            
        except Exception as e:
            logger.error(f"Currency features generation failed: {e}")
            return pd.DataFrame(index=data.index)
    
    async def _generate_economic_features(self, data: pd.DataFrame, 
                                        start_date: str, end_date: str) -> pd.DataFrame:
        """Generate economic indicator features"""
        features = {}
        
        try:
            # RBA cash rate sensitivity (mock implementation)
            features['rba_sensitivity'] = np.random.uniform(-2, 2, len(data))
            
            # Employment data impact
            features['employment_surprise'] = np.random.normal(0, 0.5, len(data))
            
            # Inflation expectations
            features['inflation_expectation'] = np.random.normal(2.5, 0.3, len(data))
            
            # House price momentum (important for Australian economy)
            features['house_price_momentum'] = np.random.normal(0.05, 0.03, len(data))
            
            # Retail sales growth
            features['retail_sales_growth'] = np.random.normal(0.02, 0.02, len(data))
            
            # Business confidence index
            features['business_confidence'] = np.random.normal(0, 0.15, len(data))
            
            # Consumer confidence
            features['consumer_confidence'] = np.random.normal(0, 0.12, len(data))
            
            return pd.DataFrame(features, index=data.index)
            
        except Exception as e:
            logger.error(f"Economic features generation failed: {e}")
            return pd.DataFrame(index=data.index)
    
    async def _generate_microstructure_features(self, data: pd.DataFrame) -> pd.DataFrame:
        """Generate market microstructure features"""
        features = {}
        
        try:
            # Bid-ask spread proxy (high-low spread)
            features['spread_proxy'] = (data['high'] - data['low']) / data['close']
            
            # Volume-weighted average price deviation
            features['vwap_deviation'] = self._calculate_vwap_deviation(data)
            
            # Price impact features
            features['price_impact'] = abs(data['close'].pct_change()) / np.log(data['volume'] + 1)
            
            # Tick movement features
            features['tick_direction'] = np.sign(data['close'].diff())
            features['tick_momentum'] = features['tick_direction'].rolling(5).sum()
            
            # Market depth proxy
            features['depth_proxy'] = data['volume'] / (data['high'] - data['low'])
            
            # Intraday return reversal
            features['intraday_reversal'] = (data['close'] - data['open']) * data['close'].pct_change()
            
            return pd.DataFrame(features, index=data.index)
            
        except Exception as e:
            logger.error(f"Microstructure features generation failed: {e}")
            return pd.DataFrame(index=data.index)
    
    async def _generate_seasonal_features(self, data: pd.DataFrame) -> pd.DataFrame:
        """Generate seasonal and calendar features"""
        features = {}
        
        try:
            # Australian financial year effect (July-June)
            features['financial_year_effect'] = self._calculate_financial_year_effect(data.index)
            
            # Reporting season impact (Feb, May, Aug, Nov)
            features['reporting_season_impact'] = self._calculate_reporting_season_impact(data.index)
            
            # Resource sector seasonality
            features['resource_seasonality'] = self._calculate_resource_seasonality(data.index)
            
            # End of month/quarter effects
            features['month_end_effect'] = self._calculate_month_end_effect(data.index)
            features['quarter_end_effect'] = self._calculate_quarter_end_effect(data.index)
            
            # Holiday effects
            features['pre_holiday_effect'] = self._calculate_holiday_effect(data.index)
            
            # Day of week effects
            if hasattr(data.index, 'dayofweek'):
                features['day_of_week'] = data.index.dayofweek
                features['is_monday'] = (data.index.dayofweek == 0).astype(int)
                features['is_friday'] = (data.index.dayofweek == 4).astype(int)
            
            # Month effects
            if hasattr(data.index, 'month'):
                features['month'] = data.index.month
                features['is_december'] = (data.index.month == 12).astype(int)  # Christmas effect
                features['is_june'] = (data.index.month == 6).astype(int)  # End of financial year
            
            return pd.DataFrame(features, index=data.index)
            
        except Exception as e:
            logger.error(f"Seasonal features generation failed: {e}")
            return pd.DataFrame(index=data.index)
    
    async def _generate_risk_features(self, data: pd.DataFrame) -> pd.DataFrame:
        """Generate risk and volatility features"""
        features = {}
        
        try:
            # VaR estimates
            features['var_95'] = data['close'].pct_change().rolling(20).quantile(0.05)
            features['var_99'] = data['close'].pct_change().rolling(20).quantile(0.01)
            
            # Expected shortfall (CVaR)
            returns = data['close'].pct_change()
            features['cvar_95'] = returns.rolling(20).apply(lambda x: x[x <= x.quantile(0.05)].mean())
            
            # Downside deviation
            features['downside_deviation'] = returns.rolling(20).apply(
                lambda x: np.sqrt(np.mean(np.minimum(x, 0) ** 2))
            )
            
            # Skewness and kurtosis
            features['skewness_20d'] = returns.rolling(20).skew()
            features['kurtosis_20d'] = returns.rolling(20).kurt()
            
            # Beta to ASX200 (approximated)
            market_returns = returns.mean()  # Simplified market proxy
            features['beta_asx200'] = returns.rolling(60).corr(pd.Series(market_returns, index=returns.index))
            
            # Maximum drawdown
            features['max_drawdown_20d'] = self._calculate_rolling_max_drawdown(data['close'], 20)
            
            return pd.DataFrame(features, index=data.index)
            
        except Exception as e:
            logger.error(f"Risk features generation failed: {e}")
            return pd.DataFrame(index=data.index)
    
    async def _generate_labels(self, data: pd.DataFrame) -> pd.DataFrame:
        """Generate prediction labels (forward returns)"""
        labels = {}
        
        try:
            # Forward returns at different horizons
            labels['return_1d'] = data['close'].pct_change().shift(-1)
            labels['return_5d'] = data['close'].pct_change(5).shift(-5)
            labels['return_20d'] = data['close'].pct_change(20).shift(-20)
            
            # Classification labels
            labels['direction_1d'] = (labels['return_1d'] > 0).astype(int)
            labels['direction_5d'] = (labels['return_5d'] > 0).astype(int)
            
            # Quantile-based labels
            labels['quantile_1d'] = pd.qcut(labels['return_1d'], q=5, labels=[0, 1, 2, 3, 4])
            
            return pd.DataFrame(labels, index=data.index)
            
        except Exception as e:
            logger.error(f"Label generation failed: {e}")
            return pd.DataFrame(index=data.index)
    
    # ================================
    # HELPER METHODS
    # ================================
    
    def _calculate_rsi(self, prices: pd.Series, period: int = 14) -> pd.Series:
        """Calculate Relative Strength Index"""
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        return 100 - (100 / (1 + rs))
    
    def _calculate_macd(self, prices: pd.Series, 
                       fast: int = 12, slow: int = 26, signal: int = 9) -> Tuple[pd.Series, pd.Series, pd.Series]:
        """Calculate MACD indicators"""
        exp1 = prices.ewm(span=fast).mean()
        exp2 = prices.ewm(span=slow).mean()
        macd_line = exp1 - exp2
        signal_line = macd_line.ewm(span=signal).mean()
        histogram = macd_line - signal_line
        return macd_line, signal_line, histogram
    
    def _calculate_bollinger_bands(self, prices: pd.Series, 
                                  period: int = 20, std_dev: float = 2) -> Tuple[pd.Series, pd.Series, pd.Series]:
        """Calculate Bollinger Bands"""
        middle = prices.rolling(period).mean()
        std = prices.rolling(period).std()
        upper = middle + (std * std_dev)
        lower = middle - (std * std_dev)
        return upper, middle, lower
    
    def _get_asx200_symbols(self) -> List[str]:
        """Get list of ASX200 symbols"""
        # Simplified list - in production would fetch from index provider
        asx200 = []
        for sector_info in ASX_SECTORS.values():
            asx200.extend(sector_info['stocks'])
        return asx200
    
    def _get_market_cap_tier(self, symbol: str) -> int:
        """Get market cap tier (1=Large, 2=Mid, 3=Small)"""
        # Simplified classification
        large_caps = ['CBA.AX', 'BHP.AX', 'CSL.AX', 'WBC.AX', 'ANZ.AX']
        if symbol in large_caps:
            return 1
        return 2  # Default to mid-cap
    
    def _calculate_dividend_season_proximity(self, dates: pd.DatetimeIndex) -> List[float]:
        """Calculate proximity to dividend season (Feb/Aug typically)"""
        proximities = []
        for date in dates:
            month = date.month
            # Distance to nearest dividend season month
            feb_dist = min(abs(month - 2), abs(month - 14))  # Feb next year
            aug_dist = abs(month - 8)
            min_dist = min(feb_dist, aug_dist)
            proximities.append(max(0, 6 - min_dist) / 6)  # Normalize 0-1
        return proximities
    
    def _get_franking_benefit(self, symbol: str) -> float:
        """Get franking credit benefit (Australian dividend tax credit)"""
        # Simplified - most Australian companies offer franking
        return 0.3 if symbol.endswith('.AX') else 0.0
    
    def _get_trading_session(self, dates: pd.DatetimeIndex) -> List[int]:
        """Get trading session identifier"""
        # 0=Pre-market, 1=Opening, 2=Continuous, 3=Closing
        sessions = []
        for date in dates:
            hour = date.hour
            if hour < 10:
                sessions.append(0)
            elif hour == 10:
                sessions.append(1)
            elif hour < 16:
                sessions.append(2)
            else:
                sessions.append(3)
        return sessions
    
    def _is_resources_stock(self, symbol: str) -> int:
        """Check if stock is in resources sector"""
        sector_info = self.sector_mappings.get(symbol, {})
        return 1 if sector_info.get('sector_code') in ['XEJ', 'XMJ'] else 0
    
    def _get_china_trade_exposure(self, symbol: str) -> float:
        """Get China trade exposure score"""
        # Resources and some industrials have high China exposure
        sector_info = self.sector_mappings.get(symbol, {})
        if 'china_exposed' in sector_info.get('characteristics', []):
            return 1.0
        return 0.3  # Default moderate exposure
    
    def _is_big4_bank(self, symbol: str) -> int:
        """Check if stock is one of the big 4 Australian banks"""
        big4 = ['CBA.AX', 'WBC.AX', 'ANZ.AX', 'NAB.AX']
        return 1 if symbol in big4 else 0
    
    def _calculate_financial_year_effect(self, dates: pd.DatetimeIndex) -> List[float]:
        """Calculate Australian financial year effects"""
        effects = []
        for date in dates:
            month = date.month
            if month == 6:  # End of financial year
                effects.append(1.0)
            elif month == 7:  # Start of financial year
                effects.append(0.8)
            elif month in [5, 8]:  # Near financial year end/start
                effects.append(0.5)
            else:
                effects.append(0.0)
        return effects
    
    def _calculate_reporting_season_impact(self, dates: pd.DatetimeIndex) -> List[float]:
        """Calculate reporting season impact"""
        effects = []
        reporting_months = [2, 5, 8, 11]  # Main reporting months
        for date in dates:
            month = date.month
            if month in reporting_months:
                effects.append(1.0)
            elif month in [m-1 for m in reporting_months] or month in [m+1 for m in reporting_months]:
                effects.append(0.5)
            else:
                effects.append(0.0)
        return effects
    
    def _calculate_resource_seasonality(self, dates: pd.DatetimeIndex) -> List[float]:
        """Calculate resource sector seasonality"""
        # Resources often stronger in certain seasons due to weather/demand
        effects = []
        for date in dates:
            month = date.month
            if month in [3, 4, 5]:  # Autumn - strong demand
                effects.append(1.0)
            elif month in [9, 10, 11]:  # Spring - supply ramp-up
                effects.append(-0.5)
            else:
                effects.append(0.0)
        return effects
    
    async def _validate_features(self, features: pd.DataFrame, labels: pd.DataFrame) -> Dict[str, float]:
        """Validate feature quality"""
        validation_scores = {}
        
        try:
            # Information Coefficient
            if 'return_1d' in labels.columns:
                ic_scores = []
                for col in features.columns:
                    if features[col].notna().sum() > 50:  # Minimum observations
                        corr = features[col].corr(labels['return_1d'])
                        if not pd.isna(corr):
                            ic_scores.append(abs(corr))
                
                validation_scores['mean_ic'] = np.mean(ic_scores) if ic_scores else 0.0
                validation_scores['ic_std'] = np.std(ic_scores) if ic_scores else 0.0
            
            # Feature completeness
            validation_scores['completeness'] = (1 - features.isnull().sum().sum() / features.size)
            
            # Feature stability
            if len(features) > 100:
                first_half = features[:len(features)//2]
                second_half = features[len(features)//2:]
                correlations = []
                for col in features.columns:
                    if col in first_half.columns and col in second_half.columns:
                        corr = first_half[col].corr(second_half[col])
                        if not pd.isna(corr):
                            correlations.append(corr)
                validation_scores['stability'] = np.mean(correlations) if correlations else 0.0
            
            return validation_scores
            
        except Exception as e:
            logger.error(f"Feature validation failed: {e}")
            return {'error': str(e)}
    
    def _generate_feature_descriptions(self, feature_names: List[str]) -> Dict[str, str]:
        """Generate descriptions for all features"""
        descriptions = {}
        
        # Basic technical features
        technical_patterns = {
            'returns_': 'Price return over specified period',
            'ma_': 'Moving average over specified period',
            'ma_ratio_': 'Ratio of moving averages',
            'volatility_': 'Return volatility over specified period',
            'volume_': 'Volume-based indicator',
            'rsi_': 'Relative Strength Index',
            'macd': 'MACD indicator',
            'bb_': 'Bollinger Bands indicator'
        }
        
        # Australian specific features
        au_patterns = {
            'is_asx200': 'ASX200 index membership indicator',
            'market_cap_tier': 'Market capitalization tier classification',
            'dividend_season_proximity': 'Proximity to Australian dividend season',
            'franking_benefit': 'Franking credit benefit score',
            'is_resources': 'Resources sector classification',
            'china_trade_exposure': 'China trade exposure score',
            'is_big4_bank': 'Big 4 Australian bank indicator',
            'financial_year_effect': 'Australian financial year seasonality',
            'reporting_season_impact': 'Corporate reporting season impact'
        }
        
        for feature_name in feature_names:
            description = "Feature description not available"
            
            # Check technical patterns
            for pattern, desc in technical_patterns.items():
                if pattern in feature_name:
                    description = desc
                    break
            
            # Check Australian patterns
            for pattern, desc in au_patterns.items():
                if pattern in feature_name:
                    description = desc
                    break
            
            descriptions[feature_name] = description
        
        return descriptions
    
    # Additional helper methods would be implemented here...
    # (Simplified for demonstration)
    
    def _calculate_sector_momentum(self, sector_features: pd.DataFrame) -> Dict[str, float]:
        """Calculate sector momentum scores"""
        return {sector: 0.5 for sector in ASX_SECTORS.keys()}  # Simplified
    
    def _calculate_sector_relative_strength(self, sector_features: pd.DataFrame) -> Dict[str, float]:
        """Calculate sector relative strength"""
        return {sector: 0.5 for sector in ASX_SECTORS.keys()}  # Simplified
    
    def _calculate_sector_concentration(self, symbols: List[str]) -> Dict[str, float]:
        """Calculate sector concentration"""
        return {sector: 0.1 for sector in ASX_SECTORS.keys()}  # Simplified
    
    def _calculate_commodity_exposure(self, symbols: List[str]) -> float:
        """Calculate overall commodity exposure"""
        return 0.3  # Simplified
    
    def _calculate_housing_exposure(self, symbols: List[str]) -> float:
        """Calculate housing market exposure"""
        return 0.2  # Simplified
    
    def _calculate_export_dependency(self, symbols: List[str]) -> float:
        """Calculate export dependency score"""
        return 0.4  # Simplified

# ================================
# GLOBAL INSTANCE
# ================================

# Global instance for use throughout the application
australian_feature_engineer = AustralianMarketFeatureEngineer()