"""
Portfolio CSV Import Validation System
Advanced validation framework for portfolio imports with comprehensive error handling,
data integrity checks, and performance optimization for large datasets.
"""

import asyncio
import csv
import io
import json
import logging
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple, Union
from dataclasses import dataclass, asdict
from enum import Enum
import re
import math
from pathlib import Path
import uuid
import hashlib

logger = logging.getLogger(__name__)

class ValidationLevel(Enum):
    """Validation strictness levels"""
    STRICT = "strict"           # All validations must pass
    STANDARD = "standard"       # Core validations must pass, warnings for others
    PERMISSIVE = "permissive"   # Only critical validations required

class PortfolioType(Enum):
    """Portfolio classification types"""
    PERSONAL = "personal"
    INSTITUTIONAL = "institutional"
    SUPER_FUND = "super_fund"
    MANAGED_FUND = "managed_fund"

class ValidationSeverity(Enum):
    """Validation issue severity levels"""
    CRITICAL = "critical"       # Prevents import
    ERROR = "error"            # Major issue, needs attention
    WARNING = "warning"        # Minor issue, can proceed
    INFO = "info"             # Informational

@dataclass
class ValidationIssue:
    """Individual validation issue"""
    severity: ValidationSeverity
    field: str
    row: int
    column: str
    message: str
    suggested_fix: Optional[str] = None
    raw_value: Any = None
    expected_format: Optional[str] = None

@dataclass
class PortfolioValidationResult:
    """Complete validation result for a portfolio import"""
    is_valid: bool
    total_rows: int
    valid_rows: int
    invalid_rows: int
    issues: List[ValidationIssue]
    processing_time_ms: float
    portfolio_summary: Dict[str, Any]
    data_quality_score: float
    recommendations: List[str]
    
    def get_issues_by_severity(self, severity: ValidationSeverity) -> List[ValidationIssue]:
        """Get issues filtered by severity level"""
        return [issue for issue in self.issues if issue.severity == severity]
    
    def has_critical_issues(self) -> bool:
        """Check if there are any critical issues that prevent import"""
        return any(issue.severity == ValidationSeverity.CRITICAL for issue in self.issues)

@dataclass
class PortfolioImportProgress:
    """Real-time progress tracking for portfolio imports"""
    import_id: str
    stage: str
    progress_percent: float
    current_row: int
    total_rows: int
    estimated_completion_ms: float
    current_step: str
    errors_count: int
    warnings_count: int
    started_at: datetime
    last_updated: datetime
    is_complete: bool = False
    is_cancelled: bool = False

class ASXSymbolValidator:
    """Australian Stock Exchange symbol validation"""
    
    # Common ASX sectors and their typical symbols
    ASX_SECTORS = {
        'Banking': ['CBA', 'WBC', 'ANZ', 'NAB'],
        'Mining': ['BHP', 'RIO', 'FMG', 'NCM', 'EVN'],
        'Healthcare': ['CSL', 'COH', 'RHC', 'SHL'],
        'Technology': ['XRO', 'APT', 'WTC', 'TNE'],
        'Retail': ['WOW', 'COL', 'JBH', 'HVN'],
        'Telecommunications': ['TLS', 'TPG'],
        'Energy': ['WDS', 'ORG', 'STO', 'OSH'],
        'Real Estate': ['GMG', 'SCG', 'BWP', 'CHC'],
        'Utilities': ['APA', 'AST', 'SKI']
    }
    
    @staticmethod
    def validate_asx_symbol(symbol: str) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Validate ASX symbol format and existence
        Returns: (is_valid, sector, error_message)
        """
        if not symbol:
            return False, None, "Symbol cannot be empty"
        
        # Remove .AX suffix if present
        clean_symbol = symbol.replace('.AX', '').upper()
        
        # Check basic format (3-4 letters typically)
        if not re.match(r'^[A-Z]{2,4}$', clean_symbol):
            return False, None, f"Invalid ASX symbol format: {symbol}. Expected 2-4 letters optionally followed by .AX"
        
        # Check against known symbols
        for sector, symbols in ASXSymbolValidator.ASX_SECTORS.items():
            if clean_symbol in symbols:
                return True, sector, None
        
        # If not in known list, still valid format but unknown
        return True, "Unknown", f"Symbol {clean_symbol} not in known ASX listings - please verify"

class PortfolioCSVValidator:
    """Main portfolio CSV validation engine"""
    
    # Required columns for different portfolio types
    REQUIRED_COLUMNS = {
        'personal': ['Symbol', 'Quantity', 'Purchase_Price'],
        'institutional': ['Symbol', 'Quantity', 'Purchase_Price', 'Purchase_Date'],
        'super_fund': ['Symbol', 'Quantity', 'Purchase_Price', 'Purchase_Date', 'Current_Value'],
        'managed_fund': ['Symbol', 'Quantity', 'Purchase_Price', 'Purchase_Date', 'Current_Value', 'Asset_Class']
    }
    
    # Optional columns that enhance validation
    OPTIONAL_COLUMNS = [
        'Current_Value', 'Purchase_Date', 'Asset_Class', 'Sector', 
        'Currency', 'Exchange', 'Dividend_Yield', 'Beta', 'Market_Cap'
    ]
    
    # Data type validation rules
    COLUMN_TYPES = {
        'Symbol': str,
        'Quantity': (int, float),
        'Purchase_Price': (int, float),
        'Current_Value': (int, float),
        'Purchase_Date': str,
        'Asset_Class': str,
        'Sector': str,
        'Currency': str,
        'Exchange': str,
        'Dividend_Yield': (int, float),
        'Beta': (int, float),
        'Market_Cap': (int, float)
    }
    
    # Business rule constraints
    BUSINESS_RULES = {
        'min_quantity': 0.001,           # Minimum position size
        'max_quantity': 1_000_000_000,   # Maximum position size
        'min_price': 0.001,              # Minimum price (0.1 cent)
        'max_price': 100_000,            # Maximum price ($100k)
        'max_portfolio_positions': 10_000, # Maximum positions in portfolio
        'max_single_position_weight': 0.50, # 50% max single position
        'date_range_years': 50           # Maximum historical range
    }
    
    def __init__(self, validation_level: ValidationLevel = ValidationLevel.STANDARD):
        self.validation_level = validation_level
        self.symbol_validator = ASXSymbolValidator()
        self.progress_callbacks = []
        
    async def validate_portfolio_csv(
        self, 
        csv_content: Union[str, bytes, io.StringIO], 
        portfolio_type: PortfolioType = PortfolioType.PERSONAL,
        account_id: Optional[str] = None,
        import_id: Optional[str] = None
    ) -> PortfolioValidationResult:
        """
        Main validation method for portfolio CSV imports
        """
        start_time = datetime.now()
        import_id = import_id or str(uuid.uuid4())
        
        try:
            # Initialize progress tracking
            progress = PortfolioImportProgress(
                import_id=import_id,
                stage="parsing",
                progress_percent=0.0,
                current_row=0,
                total_rows=0,
                estimated_completion_ms=0.0,
                current_step="Reading CSV file",
                errors_count=0,
                warnings_count=0,
                started_at=start_time,
                last_updated=start_time
            )
            
            await self._update_progress(progress)
            
            # Parse CSV content
            df, parse_issues = await self._parse_csv_content(csv_content, progress)
            if df is None:
                # Critical parsing error
                end_time = datetime.now()
                return PortfolioValidationResult(
                    is_valid=False,
                    total_rows=0,
                    valid_rows=0,
                    invalid_rows=0,
                    issues=parse_issues,
                    processing_time_ms=(end_time - start_time).total_seconds() * 1000,
                    portfolio_summary={},
                    data_quality_score=0.0,
                    recommendations=["Fix CSV parsing errors before retry"]
                )
            
            progress.total_rows = len(df)
            progress.stage = "validation"
            progress.current_step = "Validating data structure"
            progress.progress_percent = 20.0
            await self._update_progress(progress)
            
            # Validate data structure
            all_issues = parse_issues.copy()
            structure_issues = await self._validate_structure(df, portfolio_type, progress)
            all_issues.extend(structure_issues)
            
            # Validate data content
            progress.current_step = "Validating data content"
            progress.progress_percent = 40.0
            await self._update_progress(progress)
            
            content_issues = await self._validate_content(df, progress)
            all_issues.extend(content_issues)
            
            # Validate business rules
            progress.current_step = "Applying business rules"
            progress.progress_percent = 60.0
            await self._update_progress(progress)
            
            business_issues = await self._validate_business_rules(df, progress)
            all_issues.extend(business_issues)
            
            # Generate portfolio summary and quality metrics
            progress.current_step = "Generating portfolio analysis"
            progress.progress_percent = 80.0
            await self._update_progress(progress)
            
            portfolio_summary = await self._generate_portfolio_summary(df)
            data_quality_score = self._calculate_data_quality_score(all_issues, len(df))
            recommendations = self._generate_recommendations(all_issues, portfolio_summary)
            
            # Count valid/invalid rows
            critical_issues = [i for i in all_issues if i.severity == ValidationSeverity.CRITICAL]
            critical_rows = set(i.row for i in critical_issues)
            valid_rows = len(df) - len(critical_rows)
            invalid_rows = len(critical_rows)
            
            # Determine overall validity
            is_valid = len(critical_issues) == 0
            
            # Final progress update
            progress.stage = "complete"
            progress.current_step = "Validation complete"
            progress.progress_percent = 100.0
            progress.is_complete = True
            progress.errors_count = len([i for i in all_issues if i.severity in [ValidationSeverity.CRITICAL, ValidationSeverity.ERROR]])
            progress.warnings_count = len([i for i in all_issues if i.severity == ValidationSeverity.WARNING])
            await self._update_progress(progress)
            
            end_time = datetime.now()
            processing_time_ms = (end_time - start_time).total_seconds() * 1000
            
            result = PortfolioValidationResult(
                is_valid=is_valid,
                total_rows=len(df),
                valid_rows=valid_rows,
                invalid_rows=invalid_rows,
                issues=all_issues,
                processing_time_ms=processing_time_ms,
                portfolio_summary=portfolio_summary,
                data_quality_score=data_quality_score,
                recommendations=recommendations
            )
            
            logger.info(f"Portfolio validation completed for import {import_id}: "
                       f"{valid_rows}/{len(df)} valid rows, "
                       f"quality score: {data_quality_score:.1f}%")
            
            return result
            
        except Exception as e:
            logger.error(f"Portfolio validation failed for import {import_id}: {e}")
            end_time = datetime.now()
            return PortfolioValidationResult(
                is_valid=False,
                total_rows=0,
                valid_rows=0,
                invalid_rows=0,
                issues=[ValidationIssue(
                    severity=ValidationSeverity.CRITICAL,
                    field="system",
                    row=0,
                    column="general",
                    message=f"Validation system error: {str(e)}",
                    suggested_fix="Contact support if error persists"
                )],
                processing_time_ms=(end_time - start_time).total_seconds() * 1000,
                portfolio_summary={},
                data_quality_score=0.0,
                recommendations=["Contact support for assistance"]
            )
    
    async def _parse_csv_content(
        self, 
        csv_content: Union[str, bytes, io.StringIO], 
        progress: PortfolioImportProgress
    ) -> Tuple[Optional[pd.DataFrame], List[ValidationIssue]]:
        """Parse CSV content with error handling"""
        issues = []
        
        try:
            # Handle different input types
            if isinstance(csv_content, bytes):
                csv_content = csv_content.decode('utf-8')
            elif isinstance(csv_content, io.StringIO):
                csv_content = csv_content.getvalue()
            
            # Try different encodings if needed
            try:
                df = pd.read_csv(io.StringIO(csv_content))
            except UnicodeDecodeError:
                # Try different encodings
                for encoding in ['utf-8-sig', 'latin-1', 'cp1252']:
                    try:
                        if isinstance(csv_content, str):
                            csv_content = csv_content.encode('utf-8')
                        df = pd.read_csv(io.BytesIO(csv_content), encoding=encoding)
                        issues.append(ValidationIssue(
                            severity=ValidationSeverity.WARNING,
                            field="encoding",
                            row=0,
                            column="file",
                            message=f"File encoding detected as {encoding}",
                            suggested_fix="Use UTF-8 encoding for better compatibility"
                        ))
                        break
                    except UnicodeDecodeError:
                        continue
                else:
                    raise UnicodeDecodeError("Unable to decode file with common encodings")
            
            # Basic file validation
            if df.empty:
                issues.append(ValidationIssue(
                    severity=ValidationSeverity.CRITICAL,
                    field="file",
                    row=0,
                    column="general",
                    message="CSV file is empty",
                    suggested_fix="Ensure file contains header row and data"
                ))
                return None, issues
            
            if len(df.columns) < 2:
                issues.append(ValidationIssue(
                    severity=ValidationSeverity.CRITICAL,
                    field="structure",
                    row=0,
                    column="general",
                    message=f"Too few columns ({len(df.columns)}). Expected at least Symbol and Quantity",
                    suggested_fix="Check CSV delimiter and ensure proper column structure"
                ))
                return None, issues
            
            # Clean column names
            df.columns = df.columns.str.strip()
            
            # Remove completely empty rows
            initial_rows = len(df)
            df = df.dropna(how='all')
            dropped_rows = initial_rows - len(df)
            
            if dropped_rows > 0:
                issues.append(ValidationIssue(
                    severity=ValidationSeverity.INFO,
                    field="structure",
                    row=0,
                    column="general",
                    message=f"Removed {dropped_rows} empty rows",
                    suggested_fix="Remove empty rows from source file"
                ))
            
            return df, issues
            
        except Exception as e:
            issues.append(ValidationIssue(
                severity=ValidationSeverity.CRITICAL,
                field="parsing",
                row=0,
                column="file",
                message=f"Failed to parse CSV: {str(e)}",
                suggested_fix="Check file format and ensure it's a valid CSV file"
            ))
            return None, issues
    
    async def _validate_structure(
        self, 
        df: pd.DataFrame, 
        portfolio_type: PortfolioType, 
        progress: PortfolioImportProgress
    ) -> List[ValidationIssue]:
        """Validate CSV structure and required columns"""
        issues = []
        required_cols = self.REQUIRED_COLUMNS[portfolio_type.value]
        
        # Check for required columns
        missing_cols = []
        for col in required_cols:
            if col not in df.columns:
                # Try common variations
                variations = self._get_column_variations(col)
                found_variation = None
                for variation in variations:
                    if variation in df.columns:
                        found_variation = variation
                        break
                
                if found_variation:
                    # Rename column to standard name
                    df.rename(columns={found_variation: col}, inplace=True)
                    issues.append(ValidationIssue(
                        severity=ValidationSeverity.WARNING,
                        field="structure",
                        row=0,
                        column=found_variation,
                        message=f"Column '{found_variation}' renamed to standard '{col}'",
                        suggested_fix=f"Use standard column name '{col}' in future imports"
                    ))
                else:
                    missing_cols.append(col)
        
        if missing_cols:
            issues.append(ValidationIssue(
                severity=ValidationSeverity.CRITICAL,
                field="structure",
                row=0,
                column="general",
                message=f"Missing required columns: {', '.join(missing_cols)}",
                suggested_fix=f"Add columns: {', '.join(missing_cols)}",
                expected_format=f"Required columns for {portfolio_type.value}: {', '.join(required_cols)}"
            ))
        
        # Check for duplicate column names
        if len(df.columns) != len(set(df.columns)):
            duplicates = [col for col in df.columns if list(df.columns).count(col) > 1]
            issues.append(ValidationIssue(
                severity=ValidationSeverity.ERROR,
                field="structure",
                row=0,
                column="general",
                message=f"Duplicate column names found: {', '.join(set(duplicates))}",
                suggested_fix="Ensure each column has a unique name"
            ))
        
        # Check for reasonable number of rows
        max_positions = self.BUSINESS_RULES['max_portfolio_positions']
        if len(df) > max_positions:
            issues.append(ValidationIssue(
                severity=ValidationSeverity.ERROR,
                field="structure",
                row=0,
                column="general",
                message=f"Portfolio has {len(df)} positions, exceeding limit of {max_positions}",
                suggested_fix="Split large portfolios into multiple imports or contact support"
            ))
        
        return issues
    
    async def _validate_content(self, df: pd.DataFrame, progress: PortfolioImportProgress) -> List[ValidationIssue]:
        """Validate individual cell content and data types"""
        issues = []
        total_rows = len(df)
        
        for idx, row in df.iterrows():
            # Update progress periodically
            if idx % 100 == 0:
                progress.current_row = idx
                progress.progress_percent = 40.0 + (idx / total_rows * 20.0)  # 40-60% range
                await self._update_progress(progress)
            
            # Validate Symbol
            if 'Symbol' in df.columns:
                symbol = row['Symbol']
                if pd.isna(symbol) or str(symbol).strip() == '':
                    issues.append(ValidationIssue(
                        severity=ValidationSeverity.CRITICAL,
                        field="Symbol",
                        row=idx + 2,  # +2 for header and 0-based index
                        column="Symbol",
                        message="Symbol cannot be empty",
                        suggested_fix="Provide a valid stock symbol (e.g., CBA.AX)",
                        raw_value=symbol
                    ))
                else:
                    symbol_str = str(symbol).strip().upper()
                    is_valid, sector, error_msg = self.symbol_validator.validate_asx_symbol(symbol_str)
                    if not is_valid:
                        issues.append(ValidationIssue(
                            severity=ValidationSeverity.ERROR,
                            field="Symbol",
                            row=idx + 2,
                            column="Symbol",
                            message=error_msg,
                            suggested_fix="Use valid ASX symbol format (e.g., CBA.AX)",
                            raw_value=symbol,
                            expected_format="2-4 letters optionally followed by .AX"
                        ))
                    elif "not in known ASX listings" in (error_msg or ""):
                        issues.append(ValidationIssue(
                            severity=ValidationSeverity.WARNING,
                            field="Symbol",
                            row=idx + 2,
                            column="Symbol",
                            message=error_msg,
                            suggested_fix="Verify symbol is correct and currently listed",
                            raw_value=symbol
                        ))
            
            # Validate Quantity
            if 'Quantity' in df.columns:
                quantity = row['Quantity']
                if pd.isna(quantity):
                    issues.append(ValidationIssue(
                        severity=ValidationSeverity.CRITICAL,
                        field="Quantity",
                        row=idx + 2,
                        column="Quantity",
                        message="Quantity cannot be empty",
                        suggested_fix="Provide a positive number",
                        raw_value=quantity
                    ))
                else:
                    try:
                        qty_float = float(quantity)
                        if qty_float <= 0:
                            issues.append(ValidationIssue(
                                severity=ValidationSeverity.ERROR,
                                field="Quantity",
                                row=idx + 2,
                                column="Quantity",
                                message="Quantity must be positive",
                                suggested_fix="Use positive numbers only",
                                raw_value=quantity
                            ))
                        elif qty_float < self.BUSINESS_RULES['min_quantity']:
                            issues.append(ValidationIssue(
                                severity=ValidationSeverity.WARNING,
                                field="Quantity",
                                row=idx + 2,
                                column="Quantity",
                                message=f"Quantity {qty_float} is very small (minimum {self.BUSINESS_RULES['min_quantity']})",
                                suggested_fix="Check if this is the intended quantity",
                                raw_value=quantity
                            ))
                        elif qty_float > self.BUSINESS_RULES['max_quantity']:
                            issues.append(ValidationIssue(
                                severity=ValidationSeverity.ERROR,
                                field="Quantity",
                                row=idx + 2,
                                column="Quantity",
                                message=f"Quantity {qty_float} exceeds maximum allowed ({self.BUSINESS_RULES['max_quantity']})",
                                suggested_fix="Check quantity or contact support for large positions",
                                raw_value=quantity
                            ))
                    except (ValueError, TypeError):
                        issues.append(ValidationIssue(
                            severity=ValidationSeverity.CRITICAL,
                            field="Quantity",
                            row=idx + 2,
                            column="Quantity",
                            message="Quantity must be a number",
                            suggested_fix="Use numeric values only (e.g., 100, 150.5)",
                            raw_value=quantity,
                            expected_format="Positive number"
                        ))
            
            # Validate Purchase_Price
            if 'Purchase_Price' in df.columns:
                price = row['Purchase_Price']
                if pd.isna(price):
                    issues.append(ValidationIssue(
                        severity=ValidationSeverity.CRITICAL,
                        field="Purchase_Price",
                        row=idx + 2,
                        column="Purchase_Price",
                        message="Purchase price cannot be empty",
                        suggested_fix="Provide purchase price in AUD",
                        raw_value=price
                    ))
                else:
                    try:
                        # Handle string prices with currency symbols
                        price_str = str(price).replace('$', '').replace(',', '').strip()
                        price_float = float(price_str)
                        
                        if price_float <= 0:
                            issues.append(ValidationIssue(
                                severity=ValidationSeverity.ERROR,
                                field="Purchase_Price",
                                row=idx + 2,
                                column="Purchase_Price",
                                message="Purchase price must be positive",
                                suggested_fix="Use positive price values",
                                raw_value=price
                            ))
                        elif price_float < self.BUSINESS_RULES['min_price']:
                            issues.append(ValidationIssue(
                                severity=ValidationSeverity.WARNING,
                                field="Purchase_Price",
                                row=idx + 2,
                                column="Purchase_Price",
                                message=f"Price {price_float} is very low (minimum {self.BUSINESS_RULES['min_price']})",
                                suggested_fix="Check if price is in correct currency (AUD)",
                                raw_value=price
                            ))
                        elif price_float > self.BUSINESS_RULES['max_price']:
                            issues.append(ValidationIssue(
                                severity=ValidationSeverity.WARNING,
                                field="Purchase_Price",
                                row=idx + 2,
                                column="Purchase_Price",
                                message=f"Price {price_float} is very high (above {self.BUSINESS_RULES['max_price']})",
                                suggested_fix="Verify price is correct",
                                raw_value=price
                            ))
                    except (ValueError, TypeError):
                        issues.append(ValidationIssue(
                            severity=ValidationSeverity.CRITICAL,
                            field="Purchase_Price",
                            row=idx + 2,
                            column="Purchase_Price",
                            message="Purchase price must be a number",
                            suggested_fix="Use numeric values (e.g., 25.50, no currency symbols)",
                            raw_value=price,
                            expected_format="Positive number (AUD)"
                        ))
            
            # Validate Purchase_Date if present
            if 'Purchase_Date' in df.columns and pd.notna(row['Purchase_Date']):
                date_str = str(row['Purchase_Date']).strip()
                if date_str:
                    try:
                        parsed_date = pd.to_datetime(date_str, infer_datetime_format=True)
                        
                        # Check if date is reasonable
                        min_date = datetime.now() - timedelta(days=365 * self.BUSINESS_RULES['date_range_years'])
                        max_date = datetime.now() + timedelta(days=1)  # Allow today
                        
                        if parsed_date < min_date:
                            issues.append(ValidationIssue(
                                severity=ValidationSeverity.WARNING,
                                field="Purchase_Date",
                                row=idx + 2,
                                column="Purchase_Date",
                                message=f"Purchase date {parsed_date.strftime('%Y-%m-%d')} is very old",
                                suggested_fix="Verify date is correct",
                                raw_value=date_str
                            ))
                        elif parsed_date > max_date:
                            issues.append(ValidationIssue(
                                severity=ValidationSeverity.ERROR,
                                field="Purchase_Date",
                                row=idx + 2,
                                column="Purchase_Date",
                                message=f"Purchase date {parsed_date.strftime('%Y-%m-%d')} is in the future",
                                suggested_fix="Use past or current dates only",
                                raw_value=date_str
                            ))
                    except:
                        issues.append(ValidationIssue(
                            severity=ValidationSeverity.ERROR,
                            field="Purchase_Date",
                            row=idx + 2,
                            column="Purchase_Date",
                            message="Invalid date format",
                            suggested_fix="Use format DD/MM/YYYY or YYYY-MM-DD",
                            raw_value=date_str,
                            expected_format="DD/MM/YYYY or YYYY-MM-DD"
                        ))
        
        return issues
    
    async def _validate_business_rules(self, df: pd.DataFrame, progress: PortfolioImportProgress) -> List[ValidationIssue]:
        """Apply business rules and portfolio-level validations"""
        issues = []
        
        # Check for duplicate symbols
        if 'Symbol' in df.columns:
            df_clean = df.dropna(subset=['Symbol'])
            df_clean['Symbol_Clean'] = df_clean['Symbol'].str.upper().str.replace('.AX', '')
            
            duplicates = df_clean['Symbol_Clean'].duplicated()
            if duplicates.any():
                duplicate_symbols = df_clean[duplicates]['Symbol_Clean'].unique()
                for symbol in duplicate_symbols:
                    dup_rows = df_clean[df_clean['Symbol_Clean'] == symbol].index
                    for row_idx in dup_rows[1:]:  # Skip first occurrence
                        issues.append(ValidationIssue(
                            severity=ValidationSeverity.WARNING,
                            field="Symbol",
                            row=row_idx + 2,
                            column="Symbol",
                            message=f"Duplicate symbol: {symbol}",
                            suggested_fix="Remove duplicates or combine positions",
                            raw_value=df.loc[row_idx, 'Symbol']
                        ))
        
        # Calculate portfolio-level metrics
        if all(col in df.columns for col in ['Symbol', 'Quantity', 'Purchase_Price']):
            # Calculate position values
            df_valid = df.dropna(subset=['Symbol', 'Quantity', 'Purchase_Price'])
            
            try:
                df_valid['Position_Value'] = pd.to_numeric(df_valid['Quantity'], errors='coerce') * \
                                           pd.to_numeric(df_valid['Purchase_Price'], errors='coerce')
                
                total_value = df_valid['Position_Value'].sum()
                
                if total_value > 0:
                    df_valid['Weight'] = df_valid['Position_Value'] / total_value
                    
                    # Check position concentration
                    max_weight = df_valid['Weight'].max()
                    max_weight_threshold = self.BUSINESS_RULES['max_single_position_weight']
                    
                    if max_weight > max_weight_threshold:
                        max_symbol = df_valid.loc[df_valid['Weight'].idxmax(), 'Symbol']
                        max_row = df_valid['Weight'].idxmax()
                        
                        issues.append(ValidationIssue(
                            severity=ValidationSeverity.WARNING,
                            field="Portfolio Concentration",
                            row=max_row + 2,
                            column="Weight",
                            message=f"Position {max_symbol} represents {max_weight:.1%} of portfolio (above {max_weight_threshold:.0%} threshold)",
                            suggested_fix="Consider reducing position size for better diversification",
                            raw_value=f"{max_weight:.1%}"
                        ))
                    
                    # Check for micro positions (very small weights)
                    micro_threshold = 0.001  # 0.1%
                    micro_positions = df_valid[df_valid['Weight'] < micro_threshold]
                    
                    if len(micro_positions) > 0:
                        issues.append(ValidationIssue(
                            severity=ValidationSeverity.INFO,
                            field="Portfolio Structure",
                            row=0,
                            column="general",
                            message=f"{len(micro_positions)} positions represent less than {micro_threshold:.1%} each",
                            suggested_fix="Consider consolidating or removing very small positions"
                        ))
                
            except Exception as e:
                issues.append(ValidationIssue(
                    severity=ValidationSeverity.WARNING,
                    field="Portfolio Analysis",
                    row=0,
                    column="general",
                    message=f"Could not calculate portfolio metrics: {str(e)}",
                    suggested_fix="Check data quality in Quantity and Purchase_Price columns"
                ))
        
        return issues
    
    async def _generate_portfolio_summary(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Generate comprehensive portfolio summary statistics"""
        summary = {
            'total_positions': len(df),
            'data_completeness': {},
            'value_statistics': {},
            'sector_breakdown': {},
            'asset_class_breakdown': {},
            'data_quality': {}
        }
        
        try:
            # Data completeness analysis
            for column in df.columns:
                non_null_count = df[column].notna().sum()
                completeness = (non_null_count / len(df)) * 100
                summary['data_completeness'][column] = {
                    'completeness_percent': round(completeness, 1),
                    'missing_count': len(df) - non_null_count,
                    'non_null_count': non_null_count
                }
            
            # Value statistics
            if all(col in df.columns for col in ['Quantity', 'Purchase_Price']):
                df_numeric = df.copy()
                df_numeric['Quantity'] = pd.to_numeric(df_numeric['Quantity'], errors='coerce')
                df_numeric['Purchase_Price'] = pd.to_numeric(df_numeric['Purchase_Price'], errors='coerce')
                df_numeric = df_numeric.dropna(subset=['Quantity', 'Purchase_Price'])
                
                if len(df_numeric) > 0:
                    df_numeric['Position_Value'] = df_numeric['Quantity'] * df_numeric['Purchase_Price']
                    
                    summary['value_statistics'] = {
                        'total_value': float(df_numeric['Position_Value'].sum()),
                        'average_position_value': float(df_numeric['Position_Value'].mean()),
                        'median_position_value': float(df_numeric['Position_Value'].median()),
                        'largest_position_value': float(df_numeric['Position_Value'].max()),
                        'smallest_position_value': float(df_numeric['Position_Value'].min()),
                        'value_std_dev': float(df_numeric['Position_Value'].std()),
                        'price_range': {
                            'min_price': float(df_numeric['Purchase_Price'].min()),
                            'max_price': float(df_numeric['Purchase_Price'].max()),
                            'avg_price': float(df_numeric['Purchase_Price'].mean())
                        },
                        'quantity_range': {
                            'min_quantity': float(df_numeric['Quantity'].min()),
                            'max_quantity': float(df_numeric['Quantity'].max()),
                            'avg_quantity': float(df_numeric['Quantity'].mean())
                        }
                    }
            
            # Sector analysis (if Symbol column exists)
            if 'Symbol' in df.columns:
                sector_counts = {}
                for _, row in df.iterrows():
                    symbol = str(row['Symbol']).strip().upper().replace('.AX', '')
                    if symbol:
                        _, sector, _ = self.symbol_validator.validate_asx_symbol(symbol)
                        sector = sector or 'Unknown'
                        sector_counts[sector] = sector_counts.get(sector, 0) + 1
                
                summary['sector_breakdown'] = sector_counts
            
            # Asset class breakdown (if Asset_Class column exists)
            if 'Asset_Class' in df.columns:
                asset_class_counts = df['Asset_Class'].value_counts().to_dict()
                summary['asset_class_breakdown'] = asset_class_counts
            
            # Data quality metrics
            total_cells = len(df) * len(df.columns)
            non_null_cells = df.notna().sum().sum()
            completeness_score = (non_null_cells / total_cells) * 100 if total_cells > 0 else 0
            
            summary['data_quality'] = {
                'overall_completeness_percent': round(completeness_score, 1),
                'total_cells': total_cells,
                'populated_cells': int(non_null_cells),
                'empty_cells': total_cells - int(non_null_cells)
            }
            
        except Exception as e:
            logger.error(f"Error generating portfolio summary: {e}")
            summary['error'] = str(e)
        
        return summary
    
    def _calculate_data_quality_score(self, issues: List[ValidationIssue], total_rows: int) -> float:
        """Calculate overall data quality score (0-100)"""
        if total_rows == 0:
            return 0.0
        
        # Weight different severity levels
        weights = {
            ValidationSeverity.CRITICAL: -10,
            ValidationSeverity.ERROR: -5,
            ValidationSeverity.WARNING: -2,
            ValidationSeverity.INFO: -0.5
        }
        
        penalty = sum(weights.get(issue.severity, 0) for issue in issues)
        
        # Base score starts at 100
        base_score = 100.0
        
        # Apply penalties proportional to dataset size
        score = base_score + (penalty / max(total_rows, 1)) * 10
        
        # Ensure score is between 0 and 100
        return max(0.0, min(100.0, score))
    
    def _generate_recommendations(self, issues: List[ValidationIssue], portfolio_summary: Dict[str, Any]) -> List[str]:
        """Generate actionable recommendations based on validation results"""
        recommendations = []
        
        critical_issues = [i for i in issues if i.severity == ValidationSeverity.CRITICAL]
        error_issues = [i for i in issues if i.severity == ValidationSeverity.ERROR]
        warning_issues = [i for i in issues if i.severity == ValidationSeverity.WARNING]
        
        if critical_issues:
            recommendations.append(f"Fix {len(critical_issues)} critical issues before proceeding with import")
        
        if error_issues:
            recommendations.append(f"Review and fix {len(error_issues)} error conditions")
        
        if warning_issues:
            recommendations.append(f"Consider addressing {len(warning_issues)} warnings for better data quality")
        
        # Specific recommendations based on common issues
        symbol_issues = [i for i in issues if i.field == "Symbol"]
        if len(symbol_issues) > 3:
            recommendations.append("Review symbol format - use ASX standard format (e.g., CBA.AX)")
        
        date_issues = [i for i in issues if i.field == "Purchase_Date"]
        if len(date_issues) > 2:
            recommendations.append("Standardize date format to DD/MM/YYYY or YYYY-MM-DD")
        
        # Portfolio-specific recommendations
        if 'value_statistics' in portfolio_summary:
            stats = portfolio_summary['value_statistics']
            if 'largest_position_value' in stats and 'total_value' in stats:
                if stats['total_value'] > 0:
                    concentration = stats['largest_position_value'] / stats['total_value']
                    if concentration > 0.3:
                        recommendations.append("Consider diversifying - largest position represents >30% of portfolio")
        
        if not recommendations:
            recommendations.append("Portfolio data quality is good - ready for import")
        
        return recommendations
    
    def _get_column_variations(self, standard_name: str) -> List[str]:
        """Get common variations of column names"""
        variations = {
            'Symbol': ['Ticker', 'Stock', 'Code', 'Security', 'Instrument'],
            'Quantity': ['Qty', 'Shares', 'Units', 'Amount', 'Holdings'],
            'Purchase_Price': ['Price', 'Buy_Price', 'Cost', 'Purchase_Cost', 'Entry_Price'],
            'Purchase_Date': ['Date', 'Buy_Date', 'Entry_Date', 'Trade_Date'],
            'Current_Value': ['Value', 'Market_Value', 'Current_Price', 'Market_Price'],
            'Asset_Class': ['Class', 'Type', 'Category']
        }
        
        return variations.get(standard_name, [])
    
    async def _update_progress(self, progress: PortfolioImportProgress):
        """Update progress and notify callbacks"""
        progress.last_updated = datetime.now()
        
        # Estimate completion time based on current progress
        if progress.progress_percent > 0:
            elapsed = (progress.last_updated - progress.started_at).total_seconds()
            estimated_total = elapsed / (progress.progress_percent / 100.0)
            remaining = estimated_total - elapsed
            progress.estimated_completion_ms = remaining * 1000
        
        # Notify progress callbacks
        for callback in self.progress_callbacks:
            try:
                await callback(progress)
            except Exception as e:
                logger.error(f"Progress callback error: {e}")
    
    def add_progress_callback(self, callback):
        """Add progress update callback function"""
        self.progress_callbacks.append(callback)
    
    def remove_progress_callback(self, callback):
        """Remove progress update callback function"""
        if callback in self.progress_callbacks:
            self.progress_callbacks.remove(callback)

# Global validator instance
portfolio_validator = PortfolioCSVValidator()