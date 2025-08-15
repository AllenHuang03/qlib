import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Insights,
  Lightbulb,
  Warning,
  Info,
  CheckCircle,
  Star,
  Timeline,
  Assessment,
  AccountBalance,
  MonetizationOn,
  Speed,
  Psychology,
  MoreVert,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AIInsight {
  id: string;
  type: 'opportunity' | 'warning' | 'neutral' | 'action';
  title: string;
  description: string;
  confidence: number;
  impact: 'High' | 'Medium' | 'Low';
  category: string;
  actionable: boolean;
  timestamp: string;
}

interface MarketSentiment {
  symbol: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  score: number;
  change24h: number;
  newsCount: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`ai-insights-tabpanel-${index}`}
      aria-labelledby={`ai-insights-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AIInsights() {
  const [tabValue, setTabValue] = useState(0);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [marketSentiment, setMarketSentiment] = useState<MarketSentiment[]>([]);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<AIInsight | null>(null);

  useEffect(() => {
    // Sample AI insights
    setInsights([
      {
        id: 'insight_001',
        type: 'opportunity',
        title: 'Banking Sector Momentum Building',
        description: 'CBA and WBC showing strong technical patterns with increasing volume. Interest rate cycle may favor banking profits in Q2.',
        confidence: 87,
        impact: 'High',
        category: 'Sector Analysis',
        actionable: true,
        timestamp: '2024-01-12 09:30',
      },
      {
        id: 'insight_002',
        type: 'warning',
        title: 'Technology Sector Volatility Alert',
        description: 'Tech stocks experiencing elevated volatility due to AI regulation uncertainty. Consider reducing position sizes.',
        confidence: 92,
        impact: 'Medium',
        category: 'Risk Management',
        actionable: true,
        timestamp: '2024-01-12 08:45',
      },
      {
        id: 'insight_003',
        type: 'action',
        title: 'Portfolio Rebalancing Opportunity',
        description: 'Your allocation has drifted 8% from target. Rebalancing could improve risk-adjusted returns.',
        confidence: 78,
        impact: 'Medium',
        category: 'Portfolio Optimization',
        actionable: true,
        timestamp: '2024-01-12 07:15',
      },
      {
        id: 'insight_004',
        type: 'neutral',
        title: 'Market Outlook: Cautiously Optimistic',
        description: 'Economic indicators suggest continued growth with manageable inflation. Monitor for policy changes.',
        confidence: 65,
        impact: 'Low',
        category: 'Market Outlook',
        actionable: false,
        timestamp: '2024-01-11 16:30',
      },
    ]);

    // Sample market sentiment data
    setMarketSentiment([
      { symbol: 'CBA.AX', sentiment: 'bullish', score: 82, change24h: 5.2, newsCount: 12 },
      { symbol: 'BHP.AX', sentiment: 'bullish', score: 78, change24h: 3.1, newsCount: 8 },
      { symbol: 'CSL.AX', sentiment: 'neutral', score: 55, change24h: -1.2, newsCount: 15 },
      { symbol: 'WBC.AX', sentiment: 'bearish', score: 32, change24h: -2.8, newsCount: 9 },
      { symbol: 'TLS.AX', sentiment: 'bearish', score: 28, change24h: -4.1, newsCount: 6 },
    ]);
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUp color="success" />;
      case 'warning': return <Warning color="warning" />;
      case 'action': return <Lightbulb color="primary" />;
      default: return <Info color="info" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'opportunity': return 'success.main';
      case 'warning': return 'warning.main';
      case 'action': return 'primary.main';
      default: return 'info.main';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return <TrendingUp color="success" />;
      case 'bearish': return <TrendingDown color="error" />;
      default: return <Timeline color="action" />;
    }
  };

  const sentimentData = [
    { name: 'Bullish', value: marketSentiment.filter(s => s.sentiment === 'bullish').length, color: '#4caf50' },
    { name: 'Neutral', value: marketSentiment.filter(s => s.sentiment === 'neutral').length, color: '#ff9800' },
    { name: 'Bearish', value: marketSentiment.filter(s => s.sentiment === 'bearish').length, color: '#f44336' },
  ];

  const confidenceData = [
    { confidence: '90-100%', count: insights.filter(i => i.confidence >= 90).length },
    { confidence: '80-89%', count: insights.filter(i => i.confidence >= 80 && i.confidence < 90).length },
    { confidence: '70-79%', count: insights.filter(i => i.confidence >= 70 && i.confidence < 80).length },
    { confidence: '60-69%', count: insights.filter(i => i.confidence >= 60 && i.confidence < 70).length },
  ];

  return (
    <Box sx={{ maxWidth: 'lg', mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          AI-Powered Investment Insights
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Personalized recommendations based on advanced market analysis
        </Typography>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {insights.filter(i => i.actionable).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Actionable Insights
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {Math.round(insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Confidence
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main">
                {insights.filter(i => i.impact === 'High').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                High Impact Alerts
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">
                {marketSentiment.filter(s => s.sentiment === 'bullish').length}/{marketSentiment.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Bullish Signals
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Latest Insights" />
            <Tab label="Market Sentiment" />
            <Tab label="Portfolio Analysis" />
            <Tab label="Performance Tracking" />
          </Tabs>
        </Box>

        {/* Latest Insights Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Personalized AI Recommendations
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              These insights are generated using machine learning analysis of market data, news sentiment, and your portfolio composition.
            </Alert>
          </Box>

          <Grid container spacing={3}>
            {insights.map((insight) => (
              <Grid item xs={12} lg={6} key={insight.id}>
                <Card 
                  variant="outlined"
                  sx={{ 
                    borderLeft: 4,
                    borderLeftColor: getInsightColor(insight.type),
                    height: '100%'
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getInsightIcon(insight.type)}
                        <Typography variant="h6" fontWeight="bold">
                          {insight.title}
                        </Typography>
                      </Box>
                      <IconButton 
                        size="small" 
                        onClick={() => {
                          setSelectedInsight(insight);
                          setDetailsDialogOpen(true);
                        }}
                      >
                        <MoreVert />
                      </IconButton>
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {insight.description}
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Chip 
                        label={`${insight.confidence}% confidence`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Chip 
                        label={`${insight.impact} Impact`}
                        size="small"
                        color={insight.impact === 'High' ? 'error' : insight.impact === 'Medium' ? 'warning' : 'default'}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        {insight.category} • {new Date(insight.timestamp).toLocaleString()}
                      </Typography>
                      {insight.actionable && (
                        <Button size="small" variant="outlined">
                          Take Action
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Market Sentiment Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Overall Market Sentiment
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {sentimentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Individual Stock Sentiment
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Symbol</TableCell>
                      <TableCell>Sentiment</TableCell>
                      <TableCell align="right">Score</TableCell>
                      <TableCell align="right">24h Change</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {marketSentiment.map((item) => (
                      <TableRow key={item.symbol}>
                        <TableCell>{item.symbol}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getSentimentIcon(item.sentiment)}
                            {item.sentiment.toUpperCase()}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={item.score} 
                              sx={{ width: 60, height: 6 }}
                              color={
                                item.sentiment === 'bullish' ? 'success' :
                                item.sentiment === 'bearish' ? 'error' : 'warning'
                              }
                            />
                            {item.score}
                          </Box>
                        </TableCell>
                        <TableCell 
                          align="right"
                          sx={{ color: item.change24h >= 0 ? 'success.main' : 'error.main' }}
                        >
                          {item.change24h >= 0 ? '+' : ''}{item.change24h}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Portfolio Analysis Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Portfolio Health Score
                  </Typography>
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Typography variant="h2" color="success.main">
                      8.4/10
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Excellent diversification and risk management
                    </Typography>
                  </Box>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircle color="success" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Sector Diversification"
                        secondary="Well balanced across 6 sectors"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircle color="success" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Risk-Adjusted Returns"
                        secondary="Sharpe ratio of 1.67 (Excellent)"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Warning color="warning" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Correlation Risk"
                        secondary="Some positions are highly correlated"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    AI Confidence Distribution
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Confidence Range</TableCell>
                          <TableCell align="right">Count</TableCell>
                          <TableCell align="right">Percentage</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {confidenceData.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.confidence}</TableCell>
                            <TableCell align="right">{item.count}</TableCell>
                            <TableCell align="right">
                              {Math.round((item.count / insights.length) * 100)}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Performance Tracking Tab */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            AI Insights Performance Tracking
          </Typography>
          <Alert severity="info" sx={{ mb: 3 }}>
            Track how well our AI recommendations perform over time to continuously improve accuracy.
          </Alert>
          
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body1" sx={{ textAlign: 'center', py: 3 }}>
                Performance tracking data will be available after you've acted on several recommendations.
                Start by implementing some of the insights above to begin building your track record.
              </Typography>
            </CardContent>
          </Card>
        </TabPanel>
      </Card>

      {/* Insight Details Dialog */}
      <Dialog 
        open={detailsDialogOpen} 
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {selectedInsight && getInsightIcon(selectedInsight.type)}
            {selectedInsight?.title}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedInsight && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedInsight.description}
              </Typography>
              
              <Typography variant="h6" gutterBottom>
                Details
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Category:</strong> {selectedInsight.category}
                </Typography>
                <Typography variant="body2">
                  <strong>Confidence:</strong> {selectedInsight.confidence}%
                </Typography>
                <Typography variant="body2">
                  <strong>Impact:</strong> {selectedInsight.impact}
                </Typography>
                <Typography variant="body2">
                  <strong>Generated:</strong> {new Date(selectedInsight.timestamp).toLocaleString()}
                </Typography>
              </Box>

              {selectedInsight.actionable && (
                <Alert severity="info">
                  <Typography variant="body2">
                    This insight provides actionable recommendations. Consider implementing the suggested actions to optimize your portfolio performance.
                  </Typography>
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
          {selectedInsight?.actionable && (
            <Button variant="contained">Implement Recommendation</Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}