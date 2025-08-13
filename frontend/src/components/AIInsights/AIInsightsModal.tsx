import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Avatar,
  Grid,
  Divider,
  useTheme,
  alpha,
  IconButton,
} from '@mui/material';
import {
  Close,
  AutoAwesome,
  TrendingUp,
  Shield,
  Timeline,
  Star,
  CheckCircle,
  Psychology,
  Assessment,
} from '@mui/icons-material';

interface AIInsight {
  factor: string;
  value: string;
  impact: 'positive' | 'negative' | 'neutral';
  confidence: number;
  description: string;
}

interface SimilarSuccess {
  symbol: string;
  name: string;
  gain: string;
  timeframe: string;
  similarity: number;
}

interface AIInsightsModalProps {
  open: boolean;
  onClose: () => void;
  stock: {
    symbol: string;
    name: string;
    price: string;
    change: string;
    signal: 'BUY' | 'SELL' | 'HOLD';
    confidence: number;
    reason: string;
  };
}

const AIInsightsModal: React.FC<AIInsightsModalProps> = ({ open, onClose, stock }) => {
  const theme = useTheme();

  // Mock AI insights data
  const insights: AIInsight[] = [
    {
      factor: 'Earnings Growth',
      value: '+23.4%',
      impact: 'positive',
      confidence: 95,
      description: 'Company earnings grew 23% last quarter, beating analyst expectations',
    },
    {
      factor: 'Technical Indicators',
      value: 'Strong Bullish',
      impact: 'positive', 
      confidence: 89,
      description: 'Multiple technical indicators (RSI, MACD, Moving Averages) show upward momentum',
    },
    {
      factor: 'Market Sentiment',
      value: 'Very Positive',
      impact: 'positive',
      confidence: 87,
      description: 'Social media sentiment and analyst ratings are overwhelmingly positive',
    },
    {
      factor: 'Volume Analysis',
      value: '+45% Above Average',
      impact: 'positive',
      confidence: 82,
      description: 'Trading volume is 45% higher than average, showing strong investor interest',
    },
    {
      factor: 'Risk Level',
      value: 'Low-Medium',
      impact: 'neutral',
      confidence: 78,
      description: 'Historical volatility and beta suggest moderate risk with stable growth potential',
    },
  ];

  const similarSuccesses: SimilarSuccess[] = [
    {
      symbol: 'MSFT',
      name: 'Microsoft',
      gain: '+18.5%',
      timeframe: '3 months ago',
      similarity: 94,
    },
    {
      symbol: 'NVDA',
      name: 'NVIDIA',
      gain: '+24.2%',
      timeframe: '5 months ago', 
      similarity: 89,
    },
    {
      symbol: 'GOOGL',
      name: 'Google',
      gain: '+15.7%',
      timeframe: '2 months ago',
      similarity: 86,
    },
  ];

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive': return '#4CAF50';
      case 'negative': return '#F44336';
      default: return '#FF9800';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return '#4CAF50';
    if (confidence >= 75) return '#FF9800';
    return '#F44336';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: alpha('#4CAF50', 0.1), color: '#4CAF50' }}>
              <Psychology />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                AI Analysis: {stock.symbol}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Why our AI recommends this stock
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Stock Overview */}
        <Card sx={{ mb: 3, bgcolor: alpha('#4CAF50', 0.05) }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h5" fontWeight={600}>
                  {stock.symbol} - {stock.name}
                </Typography>
                <Typography variant="h4" fontWeight={700} sx={{ color: '#4CAF50', mt: 1 }}>
                  {stock.price} <span style={{ fontSize: '1rem', color: '#4CAF50' }}>{stock.change}</span>
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Chip 
                  label={stock.signal}
                  color={stock.signal === 'BUY' ? 'success' : 'default'}
                  sx={{ fontWeight: 600, fontSize: '1rem', px: 2, py: 1 }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Recommendation
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* AI Confidence Score */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AutoAwesome sx={{ color: '#4CAF50', mr: 1 }} />
              <Typography variant="h6" fontWeight={600}>
                AI Confidence Score
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box sx={{ flexGrow: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={stock.confidence}
                  sx={{
                    height: 12,
                    borderRadius: 6,
                    bgcolor: alpha('#4CAF50', 0.1),
                    '& .MuiLinearProgress-bar': {
                      bgcolor: getConfidenceColor(stock.confidence),
                      borderRadius: 6,
                    },
                  }}
                />
              </Box>
              <Typography variant="h6" fontWeight={600} sx={{ color: getConfidenceColor(stock.confidence) }}>
                {stock.confidence}%
              </Typography>
            </Box>
            <Typography variant="body1" color="text.secondary">
              <strong>What this means:</strong> Our AI analyzed {stock.symbol} using 50+ data points and is {stock.confidence}% confident this is a good investment. 
              This confidence level is based on historical accuracy of similar predictions.
            </Typography>
          </CardContent>
        </Card>

        {/* Key Factors Analysis */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Assessment sx={{ color: '#4CAF50', mr: 1 }} />
              <Typography variant="h6" fontWeight={600}>
                Key Factors Our AI Analyzed
              </Typography>
            </Box>
            
            <Grid container spacing={2}>
              {insights.map((insight, index) => (
                <Grid item xs={12} key={index}>
                  <Card variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {insight.factor}
                        </Typography>
                        <Chip 
                          label={insight.value}
                          size="small"
                          sx={{ 
                            ml: 2,
                            bgcolor: alpha(getImpactColor(insight.impact), 0.1),
                            color: getImpactColor(insight.impact),
                            fontWeight: 600,
                          }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LinearProgress
                          variant="determinate"
                          value={insight.confidence}
                          sx={{
                            width: 60,
                            height: 6,
                            borderRadius: 3,
                            mr: 1,
                            bgcolor: alpha('#4CAF50', 0.1),
                            '& .MuiLinearProgress-bar': {
                              bgcolor: getConfidenceColor(insight.confidence),
                              borderRadius: 3,
                            },
                          }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {insight.confidence}%
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {insight.description}
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        {/* Similar Success Stories */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Star sx={{ color: '#FFD700', mr: 1 }} />
              <Typography variant="h6" fontWeight={600}>
                Similar Success Stories
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Here are stocks with similar patterns that our AI picked successfully:
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {similarSuccesses.map((success, index) => (
                <Card key={index} variant="outlined">
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ bgcolor: alpha('#4CAF50', 0.1), color: '#4CAF50', width: 32, height: 32, mr: 2 }}>
                          {success.symbol[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {success.symbol} - {success.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {success.timeframe} • {success.similarity}% similar pattern
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h6" fontWeight={600} sx={{ color: '#4CAF50' }}>
                          {success.gain}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Profit
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* Risk Warning */}
        <Card sx={{ mt: 3, bgcolor: alpha('#FF9800', 0.05), border: `1px solid ${alpha('#FF9800', 0.2)}` }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Shield sx={{ color: '#FF9800', mr: 1 }} />
              <Typography variant="subtitle1" fontWeight={600}>
                Important: Investment Risk
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              While our AI has a strong track record, all investments carry risk. Past performance doesn't guarantee future results. 
              Only invest what you can afford to lose, and consider this as part of a diversified portfolio.
            </Typography>
          </CardContent>
        </Card>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
        <Button 
          variant="contained" 
          sx={{ bgcolor: '#4CAF50', '&:hover': { bgcolor: '#45a049' } }}
          startIcon={<CheckCircle />}
          onClick={() => {
            // Simulate adding to watchlist or making trade
            alert(`Added ${stock.symbol} to your watchlist!\n\nNext steps:\n• AI will monitor this stock\n• You'll get alerts for optimal entry points\n• Upgrade to Pro to enable automatic trading`);
            onClose();
          }}
        >
          I Understand, Proceed
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AIInsightsModal;