"""
Portfolio Test Data Generator
Generates comprehensive test CSV files for different validation scenarios
including small portfolios, large institutional portfolios, malformed data, and mixed asset classes.
"""

import csv
import random
import datetime
import io
import os
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from enum import Enum
import uuid
import numpy as np

class TestScenarioType(Enum):
    """Types of test scenarios"""
    VALID_SMALL = "valid_small_portfolio"
    VALID_LARGE = "large_institutional_portfolio"
    MALFORMED_DATA = "malformed_csv"
    MIXED_ASSETS = "mixed_asset_classes"
    EDGE_CASES = "edge_cases"
    PERFORMANCE_TEST = "performance_test"

@dataclass
class TestScenario:
    """Test scenario configuration"""
    name: str
    file_prefix: str
    expected_result: str
    test_account: str
    description: str
    row_count: int
    include_errors: bool = False
    error_rate: float = 0.0
    asset_classes: List[str] = None

class ASXTestSymbolProvider:
    """Provides realistic ASX symbols for testing"""
    
    # Real ASX symbols by sector for realistic testing
    SYMBOLS_BY_SECTOR = {
        'Banking': [
            ('CBA.AX', 'Commonwealth Bank', 110.50),
            ('WBC.AX', 'Westpac Banking', 22.85),
            ('ANZ.AX', 'ANZ Banking Group', 25.75),
            ('NAB.AX', 'National Australia Bank', 30.20),
            ('MQG.AX', 'Macquarie Group', 175.80),
            ('BOQ.AX', 'Bank of Queensland', 7.45)
        ],
        'Mining': [
            ('BHP.AX', 'BHP Group', 45.80),
            ('RIO.AX', 'Rio Tinto', 118.40),
            ('FMG.AX', 'Fortescue Metals', 22.30),
            ('NCM.AX', 'Newcrest Mining', 24.60),
            ('EVN.AX', 'Evolution Mining', 4.85),
            ('NST.AX', 'Northern Star', 12.75),
            ('IGO.AX', 'Independence Group', 6.45),
            ('MIN.AX', 'Mineral Resources', 45.20)
        ],
        'Healthcare': [
            ('CSL.AX', 'CSL Limited', 280.50),
            ('COH.AX', 'Cochlear Limited', 245.30),
            ('RHC.AX', 'Ramsay Health Care', 65.80),
            ('SHL.AX', 'Sonic Healthcare', 38.90),
            ('PME.AX', 'Pro Medicus', 42.15),
            ('RMD.AX', 'ResMed Inc', 32.45)
        ],
        'Technology': [
            ('XRO.AX', 'Xero Limited', 85.40),
            ('APT.AX', 'Afterpay Touch', 125.30),  # Note: Historical data
            ('WTC.AX', 'WiseTech Global', 55.70),
            ('TNE.AX', 'Technology One', 12.85),
            ('NXT.AX', 'NextDC Limited', 11.95),
            ('CPU.AX', 'Computershare', 22.40)
        ],
        'Retail': [
            ('WOW.AX', 'Woolworths Group', 35.60),
            ('COL.AX', 'Coles Group', 18.45),
            ('JBH.AX', 'JB Hi-Fi', 45.30),
            ('HVN.AX', 'Harvey Norman', 5.85),
            ('KMD.AX', 'KMD Brands', 1.25),
            ('PMV.AX', 'Premier Investments', 28.70)
        ],
        'Telecommunications': [
            ('TLS.AX', 'Telstra Corporation', 3.95),
            ('TPG.AX', 'TPG Telecom', 5.20)
        ],
        'Energy': [
            ('WDS.AX', 'Woodside Energy', 32.15),
            ('ORG.AX', 'Origin Energy', 8.45),
            ('STO.AX', 'Santos Limited', 7.25),
            ('OSH.AX', 'Oil Search', 4.85),
            ('BPT.AX', 'Beach Energy', 1.45)
        ],
        'Real Estate': [
            ('GMG.AX', 'Goodman Group', 22.85),
            ('SCG.AX', 'Scentre Group', 3.15),
            ('BWP.AX', 'BWP Trust', 4.25),
            ('CHC.AX', 'Charter Hall Group', 13.70),
            ('MGR.AX', 'Mirvac Group', 2.85)
        ],
        'Utilities': [
            ('APA.AX', 'APA Group', 10.45),
            ('AST.AX', 'AusNet Services', 1.85),
            ('SKI.AX', 'Spark Infrastructure', 2.15)
        ],
        'Materials': [
            ('JHX.AX', 'James Hardie', 42.30),
            ('ORI.AX', 'Orica Limited', 16.85),
            ('IPL.AX', 'Incitec Pivot', 3.25),
            ('AWC.AX', 'Alumina Limited', 1.75)
        ]
    }
    
    # Alternative asset classes for mixed portfolios
    ALTERNATIVE_ASSETS = {
        'Bonds': [
            ('GOVT10.AX', 'Australian Government 10Y Bond', 98.50),
            ('CORP5.AX', 'Corporate Bond Index 5Y', 102.30),
            ('GSBE.AX', 'Global Short Term Bond', 25.40)
        ],
        'ETFs': [
            ('VAS.AX', 'Vanguard Australian Shares', 89.25),
            ('VGS.AX', 'Vanguard International Shares', 108.40),
            ('NDQ.AX', 'NASDAQ 100 ETF', 28.95),
            ('IVV.AX', 'iShares S&P 500 ETF', 52.80),
            ('VTS.AX', 'Vanguard US Total Market', 89.15)
        ],
        'REITs': [
            ('VPG.AX', 'Vicinity Centres', 1.85),
            ('UNI.AX', 'Unibail-Rodamco-Westfield', 3.45),
            ('SCP.AX', 'Shopping Centres Australasia', 2.25)
        ],
        'Commodities': [
            ('GOLD.AX', 'Gold ETF', 25.80),
            ('QAU.AX', 'BetaShares Gold Bullion', 18.95),
            ('OIL.AX', 'Oil ETF', 15.25)
        ]
    }
    
    @classmethod
    def get_random_symbols(cls, count: int, sectors: Optional[List[str]] = None) -> List[tuple]:
        """Get random symbols with realistic data"""
        if sectors:
            available_symbols = []
            for sector in sectors:
                if sector in cls.SYMBOLS_BY_SECTOR:
                    available_symbols.extend(cls.SYMBOLS_BY_SECTOR[sector])
        else:
            available_symbols = []
            for sector_symbols in cls.SYMBOLS_BY_SECTOR.values():
                available_symbols.extend(sector_symbols)
        
        return random.sample(available_symbols, min(count, len(available_symbols)))
    
    @classmethod
    def get_mixed_asset_symbols(cls, count: int) -> List[tuple]:
        """Get symbols from mixed asset classes"""
        all_symbols = []
        
        # Add stocks (70% of portfolio)
        stock_count = int(count * 0.7)
        for sector_symbols in cls.SYMBOLS_BY_SECTOR.values():
            all_symbols.extend(sector_symbols)
        
        selected_stocks = random.sample(all_symbols, min(stock_count, len(all_symbols)))
        
        # Add alternative assets (30% of portfolio)
        alt_count = count - len(selected_stocks)
        alt_symbols = []
        for asset_class_symbols in cls.ALTERNATIVE_ASSETS.values():
            alt_symbols.extend(asset_class_symbols)
        
        if alt_count > 0:
            selected_alts = random.sample(alt_symbols, min(alt_count, len(alt_symbols)))
            selected_stocks.extend(selected_alts)
        
        return selected_stocks

class PortfolioTestDataGenerator:
    """Main test data generator"""
    
    def __init__(self, output_dir: str = "test_data"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        self.symbol_provider = ASXTestSymbolProvider()
        
        # Define test scenarios
        self.test_scenarios = [
            TestScenario(
                name="valid_small_portfolio",
                file_prefix="test_portfolio_small",
                expected_result="success",
                test_account="verified@test.com",
                description="10 ASX holdings, valid format",
                row_count=10,
                include_errors=False
            ),
            TestScenario(
                name="large_institutional_portfolio",
                file_prefix="test_portfolio_10k_holdings",
                expected_result="success",
                test_account="institution@test.com",
                description="10,000+ positions across multiple asset classes",
                row_count=10000,
                include_errors=False
            ),
            TestScenario(
                name="malformed_csv",
                file_prefix="test_portfolio_malformed",
                expected_result="validation_error",
                test_account="verified@test.com",
                description="Missing columns, invalid data types",
                row_count=20,
                include_errors=True,
                error_rate=0.4
            ),
            TestScenario(
                name="mixed_asset_classes",
                file_prefix="test_portfolio_mixed_assets",
                expected_result="success",
                test_account="premium@test.com",
                description="Stocks, bonds, ETFs, REITs across asset classes",
                row_count=50,
                include_errors=False,
                asset_classes=['stocks', 'bonds', 'etfs', 'reits']
            ),
            TestScenario(
                name="edge_cases",
                file_prefix="test_portfolio_edge_cases",
                expected_result="warning",
                test_account="verified@test.com",
                description="Edge cases: very small/large positions, unusual symbols",
                row_count=25,
                include_errors=True,
                error_rate=0.2
            ),
            TestScenario(
                name="performance_test",
                file_prefix="test_portfolio_performance",
                expected_result="success",
                test_account="institution@test.com",
                description="100MB+ file for performance testing",
                row_count=100000,
                include_errors=False
            )
        ]
    
    def generate_all_test_files(self) -> Dict[str, Any]:
        """Generate all test scenario files"""
        results = {}
        
        for scenario in self.test_scenarios:
            try:
                file_path = self.generate_scenario_file(scenario)
                results[scenario.name] = {
                    'status': 'success',
                    'file_path': str(file_path),
                    'description': scenario.description,
                    'expected_result': scenario.expected_result,
                    'test_account': scenario.test_account,
                    'row_count': scenario.row_count
                }
                print(f"[SUCCESS] Generated {scenario.name}: {file_path}")
                
            except Exception as e:
                results[scenario.name] = {
                    'status': 'error',
                    'error': str(e),
                    'description': scenario.description
                }
                print(f"[ERROR] Failed to generate {scenario.name}: {e}")
        
        # Generate test scenario summary
        summary_file = self.output_dir / "test_scenarios_summary.json"
        with open(summary_file, 'w') as f:
            import json
            json.dump(results, f, indent=2)
        
        return results
    
    def generate_scenario_file(self, scenario: TestScenario) -> Path:
        """Generate CSV file for a specific test scenario"""
        file_path = self.output_dir / f"{scenario.file_prefix}.csv"
        
        if scenario.name == "valid_small_portfolio":
            return self._generate_valid_small_portfolio(file_path)
        elif scenario.name == "large_institutional_portfolio":
            return self._generate_large_institutional_portfolio(file_path)
        elif scenario.name == "malformed_csv":
            return self._generate_malformed_csv(file_path)
        elif scenario.name == "mixed_asset_classes":
            return self._generate_mixed_asset_portfolio(file_path)
        elif scenario.name == "edge_cases":
            return self._generate_edge_cases_portfolio(file_path)
        elif scenario.name == "performance_test":
            return self._generate_performance_test_portfolio(file_path)
        else:
            raise ValueError(f"Unknown scenario: {scenario.name}")
    
    def _generate_valid_small_portfolio(self, file_path: Path) -> Path:
        """Generate small valid portfolio (10 positions)"""
        symbols = self.symbol_provider.get_random_symbols(10)
        
        with open(file_path, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            
            # Write header
            writer.writerow(['Symbol', 'Quantity', 'Purchase_Price', 'Purchase_Date', 'Current_Value'])
            
            # Generate realistic data
            for symbol, name, current_price in symbols:
                # Generate purchase data
                purchase_date = self._random_date_in_range(
                    datetime.date.today() - datetime.timedelta(days=365*2),
                    datetime.date.today() - datetime.timedelta(days=30)
                )
                
                # Purchase price with some historical variance
                price_variance = random.uniform(0.8, 1.2)
                purchase_price = round(current_price * price_variance, 2)
                
                # Realistic quantity based on price
                if current_price > 100:
                    quantity = random.randint(10, 100)
                elif current_price > 20:
                    quantity = random.randint(50, 500)
                else:
                    quantity = random.randint(100, 2000)
                
                current_value = round(quantity * current_price, 2)
                
                writer.writerow([
                    symbol,
                    quantity,
                    purchase_price,
                    purchase_date.strftime('%d/%m/%Y'),
                    current_value
                ])
        
        return file_path
    
    def _generate_large_institutional_portfolio(self, file_path: Path) -> Path:
        """Generate large institutional portfolio (10,000+ positions)"""
        target_positions = 10000
        symbols_base = []
        
        # Get all available symbols
        for sector_symbols in self.symbol_provider.SYMBOLS_BY_SECTOR.values():
            symbols_base.extend(sector_symbols)
        
        # Add alternative assets
        for asset_class_symbols in self.symbol_provider.ALTERNATIVE_ASSETS.values():
            symbols_base.extend(asset_class_symbols)
        
        with open(file_path, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            
            # Write header for institutional portfolio
            writer.writerow([
                'Symbol', 'Quantity', 'Purchase_Price', 'Purchase_Date', 
                'Current_Value', 'Asset_Class', 'Sector', 'Currency', 'Exchange'
            ])
            
            # Generate positions (allowing duplicates for different purchase dates)
            for i in range(target_positions):
                if i % 1000 == 0:
                    print(f"  Generating position {i+1}/{target_positions}")
                
                # Select symbol (with repetition allowed)
                symbol, name, current_price = random.choice(symbols_base)
                
                # Determine asset class and sector
                asset_class = self._determine_asset_class(symbol)
                sector = self._determine_sector(symbol)
                
                # Purchase date (wider range for institutional)
                purchase_date = self._random_date_in_range(
                    datetime.date.today() - datetime.timedelta(days=365*10),
                    datetime.date.today()
                )
                
                # Purchase price with historical variance
                price_variance = random.uniform(0.6, 1.4)  # Wider range for institutional
                purchase_price = round(current_price * price_variance, 2)
                
                # Institutional-sized quantities
                if current_price > 100:
                    quantity = random.randint(100, 10000)
                elif current_price > 20:
                    quantity = random.randint(500, 50000)
                else:
                    quantity = random.randint(1000, 200000)
                
                current_value = round(quantity * current_price, 2)
                
                writer.writerow([
                    symbol,
                    quantity,
                    purchase_price,
                    purchase_date.strftime('%d/%m/%Y'),
                    current_value,
                    asset_class,
                    sector,
                    'AUD',
                    'ASX'
                ])
        
        return file_path
    
    def _generate_malformed_csv(self, file_path: Path) -> Path:
        """Generate CSV with various data quality issues"""
        symbols = self.symbol_provider.get_random_symbols(15)
        
        with open(file_path, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            
            # Write header with duplicate column (issue #1)
            writer.writerow(['Symbol', 'Quantity', 'Price', 'Quantity', 'Date'])  # Duplicate 'Quantity'
            
            error_count = 0
            target_errors = 8  # About 40% error rate for 20 rows
            
            for i, (symbol, name, current_price) in enumerate(symbols):
                row_data = []
                
                # Symbol field - occasionally corrupt
                if error_count < target_errors and random.random() < 0.2:
                    row_data.append('')  # Empty symbol
                    error_count += 1
                elif error_count < target_errors and random.random() < 0.15:
                    row_data.append('INVALID123')  # Invalid symbol format
                    error_count += 1
                else:
                    row_data.append(symbol)
                
                # Quantity field - various errors
                if error_count < target_errors and random.random() < 0.25:
                    if random.random() < 0.5:
                        row_data.append('not_a_number')  # Text in numeric field
                    else:
                        row_data.append(-100)  # Negative quantity
                    error_count += 1
                else:
                    row_data.append(random.randint(10, 1000))
                
                # Price field - errors
                if error_count < target_errors and random.random() < 0.2:
                    if random.random() < 0.5:
                        row_data.append('$invalid')  # Invalid price format
                    else:
                        row_data.append(0)  # Zero price
                    error_count += 1
                else:
                    row_data.append(round(current_price * random.uniform(0.8, 1.2), 2))
                
                # Duplicate quantity field (from header error)
                row_data.append(random.randint(10, 1000))
                
                # Date field - various date format issues
                if error_count < target_errors and random.random() < 0.3:
                    if random.random() < 0.33:
                        row_data.append('2025-13-45')  # Invalid date
                    elif random.random() < 0.5:
                        row_data.append('not_a_date')  # Non-date text
                    else:
                        row_data.append('35/15/2024')  # Invalid day/month
                    error_count += 1
                else:
                    valid_date = self._random_date_in_range(
                        datetime.date.today() - datetime.timedelta(days=365*2),
                        datetime.date.today()
                    )
                    # Mix date formats
                    if random.random() < 0.5:
                        row_data.append(valid_date.strftime('%d/%m/%Y'))
                    else:
                        row_data.append(valid_date.strftime('%Y-%m-%d'))
                
                writer.writerow(row_data)
            
            # Add some completely empty rows
            for _ in range(3):
                writer.writerow(['', '', '', '', ''])
        
        return file_path
    
    def _generate_mixed_asset_portfolio(self, file_path: Path) -> Path:
        """Generate portfolio with mixed asset classes"""
        symbols = self.symbol_provider.get_mixed_asset_symbols(50)
        
        with open(file_path, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            
            # Extended header for mixed assets
            writer.writerow([
                'Symbol', 'Quantity', 'Purchase_Price', 'Purchase_Date', 
                'Current_Value', 'Asset_Class', 'Sector', 'Currency', 
                'Exchange', 'Dividend_Yield', 'Beta', 'Market_Cap'
            ])
            
            for symbol, name, current_price in symbols:
                # Purchase data
                purchase_date = self._random_date_in_range(
                    datetime.date.today() - datetime.timedelta(days=365*3),
                    datetime.date.today() - datetime.timedelta(days=7)
                )
                
                price_variance = random.uniform(0.7, 1.3)
                purchase_price = round(current_price * price_variance, 2)
                
                # Quantity based on asset type and price
                asset_class = self._determine_asset_class(symbol)
                if asset_class == 'Bond':
                    quantity = random.randint(10, 100)  # Bonds in smaller quantities
                elif asset_class == 'ETF':
                    quantity = random.randint(50, 1000)
                else:
                    if current_price > 100:
                        quantity = random.randint(20, 200)
                    else:
                        quantity = random.randint(100, 2000)
                
                current_value = round(quantity * current_price, 2)
                sector = self._determine_sector(symbol)
                
                # Additional fields
                dividend_yield = round(random.uniform(0.0, 8.0), 2) if asset_class in ['Stock', 'REIT'] else 0.0
                beta = round(random.uniform(0.5, 2.0), 2) if asset_class == 'Stock' else 1.0
                market_cap = random.choice(['Small', 'Mid', 'Large']) if asset_class == 'Stock' else 'N/A'
                
                writer.writerow([
                    symbol,
                    quantity,
                    purchase_price,
                    purchase_date.strftime('%d/%m/%Y'),
                    current_value,
                    asset_class,
                    sector,
                    'AUD',
                    'ASX',
                    dividend_yield,
                    beta,
                    market_cap
                ])
        
        return file_path
    
    def _generate_edge_cases_portfolio(self, file_path: Path) -> Path:
        """Generate portfolio with edge cases and boundary conditions"""
        symbols = self.symbol_provider.get_random_symbols(20)
        
        with open(file_path, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            
            writer.writerow(['Symbol', 'Quantity', 'Purchase_Price', 'Purchase_Date', 'Current_Value'])
            
            edge_cases = [
                # Very small position
                (symbols[0][0], 0.001, 0.001, '01/01/2020'),
                # Very large position
                (symbols[1][0], 10000000, 1000.0, '15/03/2021'),
                # Very old date
                (symbols[2][0], 100, 50.0, '01/01/1990'),
                # Future date (error case)
                (symbols[3][0], 100, 50.0, '01/01/2030'),
                # Zero quantity (error case)
                (symbols[4][0], 0, 25.0, '15/06/2023'),
                # Negative quantity (error case)
                (symbols[5][0], -50, 30.0, '20/08/2023'),
                # Very high price
                (symbols[6][0], 10, 50000.0, '10/10/2022'),
                # Very low price
                (symbols[7][0], 10000, 0.0001, '05/05/2023'),
                # Unusual symbol format
                ('UNKNOWN.AX', 100, 25.0, '01/02/2023'),
                ('TEST123', 50, 15.0, '15/04/2023'),
            ]
            
            # Add edge cases
            for symbol, quantity, price, date in edge_cases:
                current_value = round(quantity * price * random.uniform(0.9, 1.1), 4)
                writer.writerow([symbol, quantity, price, date, current_value])
            
            # Add some normal positions
            for symbol, name, current_price in symbols[8:]:
                purchase_date = self._random_date_in_range(
                    datetime.date.today() - datetime.timedelta(days=365),
                    datetime.date.today()
                )
                
                price_variance = random.uniform(0.8, 1.2)
                purchase_price = round(current_price * price_variance, 2)
                quantity = random.randint(10, 500)
                current_value = round(quantity * current_price, 2)
                
                writer.writerow([
                    symbol,
                    quantity,
                    purchase_price,
                    purchase_date.strftime('%d/%m/%Y'),
                    current_value
                ])
        
        return file_path
    
    def _generate_performance_test_portfolio(self, file_path: Path) -> Path:
        """Generate very large portfolio for performance testing"""
        target_positions = 100000
        symbols_base = []
        
        # Get all symbols
        for sector_symbols in self.symbol_provider.SYMBOLS_BY_SECTOR.values():
            symbols_base.extend(sector_symbols)
        for asset_class_symbols in self.symbol_provider.ALTERNATIVE_ASSETS.values():
            symbols_base.extend(asset_class_symbols)
        
        print(f"Generating performance test file with {target_positions} positions...")
        
        with open(file_path, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            
            writer.writerow([
                'Symbol', 'Quantity', 'Purchase_Price', 'Purchase_Date', 
                'Current_Value', 'Asset_Class', 'Sector'
            ])
            
            # Generate in batches to avoid memory issues
            batch_size = 10000
            for batch in range(0, target_positions, batch_size):
                if batch % 20000 == 0:
                    print(f"  Progress: {batch}/{target_positions} positions")
                
                batch_end = min(batch + batch_size, target_positions)
                
                for i in range(batch, batch_end):
                    symbol, name, current_price = random.choice(symbols_base)
                    
                    purchase_date = self._random_date_in_range(
                        datetime.date.today() - datetime.timedelta(days=365*5),
                        datetime.date.today()
                    )
                    
                    price_variance = random.uniform(0.5, 1.5)
                    purchase_price = round(current_price * price_variance, 2)
                    
                    # Vary quantity based on price
                    if current_price > 100:
                        quantity = random.randint(1, 1000)
                    elif current_price > 10:
                        quantity = random.randint(10, 5000)
                    else:
                        quantity = random.randint(100, 50000)
                    
                    current_value = round(quantity * current_price, 2)
                    asset_class = self._determine_asset_class(symbol)
                    sector = self._determine_sector(symbol)
                    
                    writer.writerow([
                        symbol,
                        quantity,
                        purchase_price,
                        purchase_date.strftime('%d/%m/%Y'),
                        current_value,
                        asset_class,
                        sector
                    ])
        
        print(f"[SUCCESS] Performance test file generated: {file_path}")
        return file_path
    
    def _random_date_in_range(self, start_date: datetime.date, end_date: datetime.date) -> datetime.date:
        """Generate random date within range"""
        time_between = end_date - start_date
        days_between = time_between.days
        random_days = random.randrange(days_between)
        return start_date + datetime.timedelta(days=random_days)
    
    def _determine_asset_class(self, symbol: str) -> str:
        """Determine asset class from symbol"""
        symbol_upper = symbol.upper()
        
        if any(symbol_upper.startswith(prefix) for prefix in ['GOVT', 'CORP', 'GSBE']):
            return 'Bond'
        elif any(symbol_upper in [s[0] for s in asset_symbols] 
                for asset_symbols in self.symbol_provider.ALTERNATIVE_ASSETS.values()):
            if symbol_upper in ['VAS.AX', 'VGS.AX', 'NDQ.AX', 'IVV.AX', 'VTS.AX']:
                return 'ETF'
            elif symbol_upper in ['GOLD.AX', 'QAU.AX', 'OIL.AX']:
                return 'Commodity'
            elif symbol_upper in ['VPG.AX', 'UNI.AX', 'SCP.AX']:
                return 'REIT'
            else:
                return 'ETF'
        else:
            return 'Stock'
    
    def _determine_sector(self, symbol: str) -> str:
        """Determine sector from symbol"""
        symbol_clean = symbol.replace('.AX', '').upper()
        
        for sector, symbols in self.symbol_provider.SYMBOLS_BY_SECTOR.items():
            if any(symbol_clean == s[0].replace('.AX', '') for s in symbols):
                return sector
        
        # Check alternative assets
        if symbol.upper() in ['GOVT10.AX', 'CORP5.AX', 'GSBE.AX']:
            return 'Fixed Income'
        elif symbol.upper() in ['VAS.AX', 'VGS.AX', 'NDQ.AX', 'IVV.AX', 'VTS.AX']:
            return 'Diversified'
        elif symbol.upper() in ['GOLD.AX', 'QAU.AX', 'OIL.AX']:
            return 'Commodities'
        elif symbol.upper() in ['VPG.AX', 'UNI.AX', 'SCP.AX']:
            return 'Real Estate'
        
        return 'Unknown'
    
    def generate_custom_scenario(
        self, 
        name: str, 
        row_count: int, 
        error_rate: float = 0.0,
        asset_classes: Optional[List[str]] = None
    ) -> Path:
        """Generate custom test scenario"""
        file_path = self.output_dir / f"test_portfolio_custom_{name}.csv"
        
        if asset_classes:
            symbols = self.symbol_provider.get_mixed_asset_symbols(row_count)
        else:
            symbols = self.symbol_provider.get_random_symbols(row_count)
        
        with open(file_path, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            
            writer.writerow(['Symbol', 'Quantity', 'Purchase_Price', 'Purchase_Date', 'Current_Value'])
            
            error_count = 0
            target_errors = int(row_count * error_rate)
            
            for symbol, name, current_price in symbols:
                # Introduce errors based on error_rate
                if error_count < target_errors and random.random() < error_rate:
                    # Generate error row
                    if random.random() < 0.33:
                        # Empty symbol
                        row = ['', random.randint(1, 1000), current_price, '01/01/2023', 0]
                    elif random.random() < 0.5:
                        # Invalid quantity
                        row = [symbol, 'not_a_number', current_price, '01/01/2023', 0]
                    else:
                        # Invalid date
                        row = [symbol, random.randint(1, 1000), current_price, 'invalid_date', 0]
                    
                    error_count += 1
                else:
                    # Generate valid row
                    purchase_date = self._random_date_in_range(
                        datetime.date.today() - datetime.timedelta(days=365*2),
                        datetime.date.today()
                    )
                    
                    price_variance = random.uniform(0.8, 1.2)
                    purchase_price = round(current_price * price_variance, 2)
                    quantity = random.randint(10, 1000)
                    current_value = round(quantity * current_price, 2)
                    
                    row = [
                        symbol,
                        quantity,
                        purchase_price,
                        purchase_date.strftime('%d/%m/%Y'),
                        current_value
                    ]
                
                writer.writerow(row)
        
        return file_path

if __name__ == "__main__":
    # Generate all test scenarios
    generator = PortfolioTestDataGenerator()
    results = generator.generate_all_test_files()
    
    print("\n=== Test Data Generation Summary ===")
    for scenario_name, result in results.items():
        if result['status'] == 'success':
            print(f"[SUCCESS] {scenario_name}: {result['row_count']} rows -> {result['file_path']}")
        else:
            print(f"[ERROR] {scenario_name}: {result['error']}")
    
    print(f"\nAll test files generated in: {generator.output_dir}")
    print("Ready for portfolio import validation testing!")