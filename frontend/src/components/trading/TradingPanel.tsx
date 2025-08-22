/**
 * Trading Panel Component
 * Professional trading interface with order management and portfolio tracking
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Card,
  CardContent,
  Alert,
  Switch,
  FormControlLabel,
  useTheme,
  alpha,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Assessment,
  Warning,
  CheckCircle
} from '@mui/icons-material';

import { SandboxTradingEngine, TradeResult, SandboxPosition } from '../../services/SandboxTradingEngine';

interface TradingPanelProps {
  symbol: string;
  currentPrice: number;
  tradingEngine: SandboxTradingEngine | null;
}

const TradingPanel: React.FC<TradingPanelProps> = ({
  symbol,
  currentPrice,
  tradingEngine
}) => {
  const theme = useTheme();
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [quantity, setQuantity] = useState(100);
  const [limitPrice, setLimitPrice] = useState(currentPrice);
  const [balance, setBalance] = useState(100000);
  const [positions, setPositions] = useState<SandboxPosition[]>([]);
  const [portfolioValue, setPortfolioValue] = useState(100000);
  const [lastTradeResult, setLastTradeResult] = useState<TradeResult | null>(null);
  const [autoTradingEnabled, setAutoTradingEnabled] = useState(false);

  // Update limit price when current price changes
  useEffect(() => {
    if (orderType === 'market') {
      setLimitPrice(currentPrice);
    }
  }, [currentPrice, orderType]);

  // Update portfolio data
  useEffect(() => {
    if (tradingEngine) {
      const portfolio = tradingEngine.getPortfolio();
      setBalance(portfolio.cash);
      setPortfolioValue(portfolio.totalValue);
      setPositions(tradingEngine.getAllPositions());
    }
  }, [tradingEngine, lastTradeResult]);

  // Calculate order value
  const orderValue = quantity * (orderType === 'market' ? currentPrice : limitPrice);
  const commission = orderValue * 0.001; // 0.1% commission
  const totalCost = orderValue + commission;

  // Get current position for the symbol
  const currentPosition = tradingEngine?.getPosition(symbol);

  // Handle buy order
  const handleBuyOrder = async () => {
    if (!tradingEngine) {
      setLastTradeResult({
        success: false,
        error: 'Trading engine not initialized'
      });
      return;
    }

    const price = orderType === 'market' ? currentPrice : limitPrice;
    const result = await tradingEngine.placeBuyOrder(symbol, price, quantity, 'manual');
    setLastTradeResult(result);

    if (result.success) {
      // Reset form
      setQuantity(100);
    }
  };

  // Handle sell order
  const handleSellOrder = async () => {
    if (!tradingEngine) {
      setLastTradeResult({
        success: false,
        error: 'Trading engine not initialized'
      });
      return;
    }

    const price = orderType === 'market' ? currentPrice : limitPrice;
    const result = await tradingEngine.placeSellOrder(symbol, price, quantity, 'manual');
    setLastTradeResult(result);

    if (result.success) {
      // Reset form
      setQuantity(100);
    }
  };

  // Calculate buying power
  const maxBuyQuantity = Math.floor(balance / (currentPrice * 1.001)); // Include commission

  return (
    <Paper
      elevation={2}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: alpha(theme.palette.background.paper, 0.95)
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}` }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
          交易面板
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {symbol} • ${currentPrice.toFixed(2)}
        </Typography>
      </Box>

      {/* Portfolio Summary */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}` }}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Card variant="outlined" sx={{ textAlign: 'center' }}>
              <CardContent sx={{ p: 1.5 }}>
                <AccountBalance fontSize="small" color="primary" />
                <Typography variant="caption" display="block">
                  现金余额
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  ${balance.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card variant="outlined" sx={{ textAlign: 'center' }}>
              <CardContent sx={{ p: 1.5 }}>
                <Assessment fontSize="small" color="success" />
                <Typography variant="caption" display="block">
                  总资产
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  ${portfolioValue.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Order Form */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}` }}>
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
          下单交易
        </Typography>

        {/* Order Type */}
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>订单类型</InputLabel>
          <Select
            value={orderType}
            onChange={(e) => setOrderType(e.target.value as 'market' | 'limit')}
            label="订单类型"
          >
            <MenuItem value="market">市价单</MenuItem>
            <MenuItem value="limit">限价单</MenuItem>
          </Select>
        </FormControl>

        {/* Quantity */}
        <TextField
          fullWidth
          size="small"
          label="数量"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
          sx={{ mb: 2 }}
          helperText={`最大买入: ${maxBuyQuantity.toLocaleString()} 股`}
        />

        {/* Limit Price (if limit order) */}
        {orderType === 'limit' && (
          <TextField
            fullWidth
            size="small"
            label="限价"
            type="number"
            value={limitPrice}
            onChange={(e) => setLimitPrice(parseFloat(e.target.value) || currentPrice)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
            }}
          />
        )}

        {/* Order Summary */}
        <Box sx={{ 
          p: 1.5, 
          background: alpha(theme.palette.background.default, 0.5),
          borderRadius: 1,
          mb: 2
        }}>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                订单价值:
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                ${orderValue.toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                手续费:
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                ${commission.toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary" fontWeight="bold">
                总计:
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                ${totalCost.toFixed(2)}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {/* Buy/Sell Buttons */}
        <Grid container spacing={1}>
          <Grid item xs={6}>
            <Button
              fullWidth
              variant="contained"
              color="success"
              onClick={handleBuyOrder}
              disabled={totalCost > balance}
              startIcon={<TrendingUp />}
              sx={{ fontWeight: 'bold' }}
            >
              买入
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              fullWidth
              variant="contained"
              color="error"
              onClick={handleSellOrder}
              disabled={!currentPosition || currentPosition.quantity < quantity}
              startIcon={<TrendingDown />}
              sx={{ fontWeight: 'bold' }}
            >
              卖出
            </Button>
          </Grid>
        </Grid>

        {/* Auto Trading Toggle */}
        <FormControlLabel
          control={
            <Switch
              checked={autoTradingEnabled}
              onChange={(e) => setAutoTradingEnabled(e.target.checked)}
              size="small"
            />
          }
          label="启用模型自动交易"
          sx={{ mt: 1 }}
        />
      </Box>

      {/* Current Position */}
      {currentPosition && (
        <Box sx={{ p: 2, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}` }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
            当前持仓 - {symbol}
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                持仓数量:
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {currentPosition.quantity.toLocaleString()} 股
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                平均成本:
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                ${currentPosition.averagePrice.toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                当前价值:
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                ${currentPosition.totalValue.toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                未实现盈亏:
              </Typography>
              <Typography 
                variant="body2" 
                fontWeight="bold"
                color={currentPosition.unrealizedPnL >= 0 ? 'success.main' : 'error.main'}
              >
                ${currentPosition.unrealizedPnL.toFixed(2)}
              </Typography>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Trade Result Alert */}
      {lastTradeResult && (
        <Box sx={{ p: 2 }}>
          <Alert 
            severity={lastTradeResult.success ? 'success' : 'error'}
            onClose={() => setLastTradeResult(null)}
            icon={lastTradeResult.success ? <CheckCircle /> : <Warning />}
          >
            {lastTradeResult.success 
              ? `交易成功执行！新余额: $${lastTradeResult.newBalance?.toFixed(2)}`
              : `交易失败: ${lastTradeResult.error}`
            }
          </Alert>
        </Box>
      )}

      {/* All Positions Summary */}
      <Box sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
          所有持仓
        </Typography>
        {positions.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
            暂无持仓
          </Typography>
        ) : (
          positions.map((position) => (
            <Card key={position.symbol} variant="outlined" sx={{ mb: 1 }}>
              <CardContent sx={{ p: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" fontWeight="bold">
                    {position.symbol}
                  </Typography>
                  <Chip
                    label={position.unrealizedPnL >= 0 ? '盈利' : '亏损'}
                    size="small"
                    color={position.unrealizedPnL >= 0 ? 'success' : 'error'}
                    variant="outlined"
                  />
                </Box>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      数量: {position.quantity}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      成本: ${position.averagePrice.toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography 
                      variant="caption" 
                      color={position.unrealizedPnL >= 0 ? 'success.main' : 'error.main'}
                      fontWeight="bold"
                    >
                      盈亏: ${position.unrealizedPnL.toFixed(2)}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))
        )}
      </Box>
    </Paper>
  );
};

export default TradingPanel;