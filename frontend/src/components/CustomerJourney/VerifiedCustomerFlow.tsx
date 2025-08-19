import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  RadioGroup,
  Radio,
  FormLabel
} from '@mui/material';
import {
  CloudUpload,
  AccountBalance,
  TrendingUp,
  Security,
  CheckCircle,
  Warning,
  Info,
  Download,
  Analytics,
  AccountBalance as BankIcon,
  CreditCard,
  Visibility,
  Delete,
  Edit,
  FileUpload,
  Assessment,
  PieChart,
  Timeline
} from '@mui/icons-material';

interface VerifiedCustomerFlowProps {
  user: any;
}

interface PortfolioImport {
  symbol: string;
  quantity: number;
  averagePrice: number;
  marketValue: number;
  sector: string;
  errors?: string[];
}

interface FundingMethod {
  id: string;
  type: 'bank_transfer' | 'bpay' | 'credit_card';
  name: string;
  accountNumber?: string;
  bsb?: string;
  billerCode?: string;
  referenceNumber?: string;
  fee: number;
  processingTime: string;
}

const VerifiedCustomerFlow: React.FC<VerifiedCustomerFlowProps> = ({ user }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [portfolioImportData, setPortfolioImportData] = useState<PortfolioImport[]>([]);
  const [showPortfolioDialog, setShowPortfolioDialog] = useState(false);
  const [showFundingDialog, setShowFundingDialog] = useState(false);
  const [selectedFundingMethod, setSelectedFundingMethod] = useState<FundingMethod | null>(null);
  const [fundingAmount, setFundingAmount] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [riskTolerance, setRiskTolerance] = useState(user?.risk_tolerance || '');
  const [investmentGoals, setInvestmentGoals] = useState<string[]>(user?.investment_goals || []);
  const [timeHorizon, setTimeHorizon] = useState('');
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const steps = [
    'Portfolio Import & Analysis',
    'Investment Profile Setup',
    'Funding Your Account',
    'Strategy Configuration',
    'Portfolio Activation'
  ];

  const fundingMethods: FundingMethod[] = [
    {
      id: 'bank_transfer',
      type: 'bank_transfer',
      name: 'Bank Transfer (EFT)',
      bsb: '123-456',
      accountNumber: '123456789',
      fee: 0,
      processingTime: '1-2 business days'
    },
    {
      id: 'bpay',
      type: 'bpay',
      name: 'BPAY',
      billerCode: '123456',
      referenceNumber: user?.id?.slice(-8) || '12345678',
      fee: 0,
      processingTime: 'Same business day'
    },
    {
      id: 'credit_card',
      type: 'credit_card',
      name: 'Credit/Debit Card',
      fee: 1.5,
      processingTime: 'Instant'
    }
  ];

  useEffect(() => {
    // Initialize portfolio data if user has existing holdings
    if (user?.portfolio_value && user?.portfolio_value > 0) {
      setPortfolioImportData([
        {
          symbol: 'CBA',
          quantity: 100,
          averagePrice: 95.50,
          marketValue: 9550,
          sector: 'Banking'
        },
        {
          symbol: 'CSL',
          quantity: 50,
          averagePrice: 280.00,
          marketValue: 14000,
          sector: 'Healthcare'
        },
        {
          symbol: 'BHP',
          quantity: 200,
          averagePrice: 45.25,
          marketValue: 9050,
          sector: 'Mining'
        }
      ]);
      setCompletedSteps(prev => new Set([...prev, 0]));
    }

    // Check if investment profile is complete
    if (user?.risk_tolerance && user?.investment_goals?.length > 0) {
      setCompletedSteps(prev => new Set([...prev, 1]));
    }

    // Check if account is funded
    if (user?.account_balance && user?.account_balance > 0) {
      setCompletedSteps(prev => new Set([...prev, 2]));
    }
  }, [user]);

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCsvFile(file);
      setIsUploading(true);
      setUploadProgress(0);

      // Simulate file upload and parsing
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsUploading(false);
            
            // Simulate parsed portfolio data
            setPortfolioImportData([
              {
                symbol: 'CBA',
                quantity: 150,
                averagePrice: 98.20,
                marketValue: 14730,
                sector: 'Banking'
              },
              {
                symbol: 'WBC',
                quantity: 100,
                averagePrice: 22.50,
                marketValue: 2250,
                sector: 'Banking'
              },
              {
                symbol: 'CSL',
                quantity: 25,
                averagePrice: 285.00,
                marketValue: 7125,
                sector: 'Healthcare'
              },
              {
                symbol: 'UNKNOWN',
                quantity: 100,
                averagePrice: 15.00,
                marketValue: 1500,
                sector: 'Unknown',
                errors: ['Symbol not found in ASX database']
              }
            ]);
            
            setCompletedSteps(prev => new Set([...prev, 0]));
            return 100;
          }
          return prev + 10;
        });
      }, 200);
    }
  };

  const downloadCsvTemplate = () => {
    const csvContent = [
      'symbol,quantity,average_price,purchase_date',
      'CBA,100,95.50,2024-01-15',
      'CSL,50,280.00,2024-02-01',
      'BHP,200,45.25,2024-03-10'
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'portfolio_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleInvestmentProfileSave = () => {
    setCompletedSteps(prev => new Set([...prev, 1]));
    setActiveStep(2);
  };

  const handleFundingComplete = () => {
    setCompletedSteps(prev => new Set([...prev, 2]));
    setActiveStep(3);
    setShowFundingDialog(false);
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Import Your Existing Portfolio
            </Typography>
            <Typography variant="body1" paragraph>
              Upload your current holdings to get personalized AI insights and portfolio optimization recommendations.
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Option 1: Upload CSV File
                    </Typography>
                    <Typography variant="body2" paragraph>
                      Upload a CSV file with your current holdings for automatic analysis.
                    </Typography>
                    
                    <Button
                      variant="outlined"
                      onClick={downloadCsvTemplate}
                      startIcon={<Download />}
                      fullWidth
                      sx={{ mb: 2 }}
                    >
                      Download CSV Template
                    </Button>

                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCsvUpload}
                      style={{ display: 'none' }}
                      id="csv-upload"
                    />
                    <label htmlFor="csv-upload">
                      <Button
                        variant="contained"
                        component="span"
                        startIcon={<CloudUpload />}
                        fullWidth
                      >
                        Upload Portfolio CSV
                      </Button>
                    </label>

                    {isUploading && (
                      <Box sx={{ mt: 2 }}>
                        <LinearProgress variant="determinate" value={uploadProgress} />
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          Processing portfolio data... {uploadProgress}%
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Option 2: Manual Entry
                    </Typography>
                    <Typography variant="body2" paragraph>
                      Manually enter your holdings one by one for precise control.
                    </Typography>
                    
                    <Button
                      variant="outlined"
                      onClick={() => setShowPortfolioDialog(true)}
                      startIcon={<Edit />}
                      fullWidth
                      sx={{ mb: 2 }}
                    >
                      Add Holdings Manually
                    </Button>

                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => {
                        setCompletedSteps(prev => new Set([...prev, 0]));
                        setActiveStep(1);
                      }}
                    >
                      Start Fresh (No Existing Holdings)
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Portfolio Analysis Results */}
            {portfolioImportData.length > 0 && (
              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Portfolio Analysis Results
                  </Typography>
                  
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Symbol</TableCell>
                          <TableCell align="right">Quantity</TableCell>
                          <TableCell align="right">Avg Price</TableCell>
                          <TableCell align="right">Market Value</TableCell>
                          <TableCell>Sector</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {portfolioImportData.map((holding, index) => (
                          <TableRow key={index}>
                            <TableCell>{holding.symbol}</TableCell>
                            <TableCell align="right">{holding.quantity.toLocaleString()}</TableCell>
                            <TableCell align="right">${holding.averagePrice.toFixed(2)}</TableCell>
                            <TableCell align="right">${holding.marketValue.toLocaleString()}</TableCell>
                            <TableCell>{holding.sector}</TableCell>
                            <TableCell>
                              {holding.errors ? (
                                <Chip label="Error" color="error" size="small" />
                              ) : (
                                <Chip label="Valid" color="success" size="small" />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">
                      Total Portfolio Value: ${portfolioImportData.reduce((sum, h) => sum + h.marketValue, 0).toLocaleString()}
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={() => {
                        setCompletedSteps(prev => new Set([...prev, 0]));
                        setActiveStep(1);
                      }}
                      startIcon={<Analytics />}
                    >
                      Proceed to Analysis
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Investment Profile Setup
            </Typography>
            <Typography variant="body1" paragraph>
              Help us understand your investment preferences to provide personalized recommendations.
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <FormLabel component="legend">Risk Tolerance</FormLabel>
                  <RadioGroup
                    value={riskTolerance}
                    onChange={(e) => setRiskTolerance(e.target.value)}
                  >
                    <FormControlLabel value="low" control={<Radio />} label="Conservative - Minimize risk, stable returns" />
                    <FormControlLabel value="medium" control={<Radio />} label="Balanced - Moderate risk for steady growth" />
                    <FormControlLabel value="high" control={<Radio />} label="Aggressive - High risk for maximum returns" />
                  </RadioGroup>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Investment Time Horizon</InputLabel>
                  <Select
                    value={timeHorizon}
                    onChange={(e) => setTimeHorizon(e.target.value)}
                    label="Investment Time Horizon"
                  >
                    <MenuItem value="short">Short-term (1-3 years)</MenuItem>
                    <MenuItem value="medium">Medium-term (3-7 years)</MenuItem>
                    <MenuItem value="long">Long-term (7+ years)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Investment Goals (Select all that apply)
                </Typography>
                {[
                  'Capital Growth',
                  'Income Generation',
                  'Retirement Planning',
                  'Wealth Preservation',
                  'Tax Optimization',
                  'Diversification'
                ].map((goal) => (
                  <FormControlLabel
                    key={goal}
                    control={
                      <Checkbox
                        checked={investmentGoals.includes(goal.toLowerCase().replace(/\s+/g, '_'))}
                        onChange={(e) => {
                          const goalValue = goal.toLowerCase().replace(/\s+/g, '_');
                          if (e.target.checked) {
                            setInvestmentGoals([...investmentGoals, goalValue]);
                          } else {
                            setInvestmentGoals(investmentGoals.filter(g => g !== goalValue));
                          }
                        }}
                      />
                    }
                    label={goal}
                    sx={{ display: 'block' }}
                  />
                ))}
              </Grid>
            </Grid>

            <Alert severity="info" sx={{ mt: 3, mb: 3 }}>
              <Typography variant="body2">
                This information helps our AI create personalized investment strategies tailored to your financial goals.
              </Typography>
            </Alert>

            <Button
              variant="contained"
              onClick={handleInvestmentProfileSave}
              disabled={!riskTolerance || !timeHorizon || investmentGoals.length === 0}
              size="large"
            >
              Save Investment Profile
            </Button>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Fund Your Account
            </Typography>
            <Typography variant="body1" paragraph>
              Add funds to your account to start investing. Choose from our secure funding options.
            </Typography>

            <Grid container spacing={2}>
              {fundingMethods.map((method) => (
                <Grid item xs={12} md={4} key={method.id}>
                  <Card 
                    variant="outlined"
                    sx={{ 
                      cursor: 'pointer',
                      border: selectedFundingMethod?.id === method.id ? 2 : 1,
                      borderColor: selectedFundingMethod?.id === method.id ? 'primary.main' : 'divider'
                    }}
                    onClick={() => setSelectedFundingMethod(method)}
                  >
                    <CardContent sx={{ textAlign: 'center' }}>
                      {method.type === 'bank_transfer' && <AccountBalance sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />}
                      {method.type === 'bpay' && <BankIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />}
                      {method.type === 'credit_card' && <CreditCard sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />}
                      
                      <Typography variant="h6">{method.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Fee: {method.fee}% • {method.processingTime}
                      </Typography>
                      
                      {selectedFundingMethod?.id === method.id && (
                        <Chip label="Selected" color="primary" size="small" sx={{ mt: 1 }} />
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {selectedFundingMethod && (
              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {selectedFundingMethod.name} Details
                  </Typography>
                  
                  {selectedFundingMethod.type === 'bank_transfer' && (
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="BSB"
                          value={selectedFundingMethod.bsb}
                          InputProps={{ readOnly: true }}
                          sx={{ mb: 2 }}
                        />
                        <TextField
                          fullWidth
                          label="Account Number"
                          value={selectedFundingMethod.accountNumber}
                          InputProps={{ readOnly: true }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Amount (AUD)"
                          value={fundingAmount}
                          onChange={(e) => setFundingAmount(e.target.value)}
                          type="number"
                          sx={{ mb: 2 }}
                        />
                        <Alert severity="info">
                          <Typography variant="body2">
                            Use reference: <strong>{user?.id}</strong> to ensure proper credit to your account.
                          </Typography>
                        </Alert>
                      </Grid>
                    </Grid>
                  )}

                  {selectedFundingMethod.type === 'bpay' && (
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Biller Code"
                          value={selectedFundingMethod.billerCode}
                          InputProps={{ readOnly: true }}
                          sx={{ mb: 2 }}
                        />
                        <TextField
                          fullWidth
                          label="Reference Number"
                          value={selectedFundingMethod.referenceNumber}
                          InputProps={{ readOnly: true }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Amount (AUD)"
                          value={fundingAmount}
                          onChange={(e) => setFundingAmount(e.target.value)}
                          type="number"
                        />
                      </Grid>
                    </Grid>
                  )}

                  {selectedFundingMethod.type === 'credit_card' && (
                    <Button
                      variant="contained"
                      onClick={() => setShowFundingDialog(true)}
                      startIcon={<CreditCard />}
                    >
                      Add Credit/Debit Card
                    </Button>
                  )}

                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      onClick={handleFundingComplete}
                      disabled={!fundingAmount || parseFloat(fundingAmount) <= 0}
                    >
                      Complete Funding Setup
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Strategy Configuration
            </Typography>
            <Typography variant="body1" paragraph>
              Based on your portfolio and investment profile, we recommend these AI-powered strategies.
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <PieChart sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6">Smart Rebalancing</Typography>
                    </Box>
                    <Typography variant="body2" paragraph>
                      Automatically maintain your target asset allocation based on market conditions and your risk profile.
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon><CheckCircle fontSize="small" color="success" /></ListItemIcon>
                        <ListItemText primary="Monthly rebalancing" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CheckCircle fontSize="small" color="success" /></ListItemIcon>
                        <ListItemText primary="Tax-loss harvesting" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CheckCircle fontSize="small" color="success" /></ListItemIcon>
                        <ListItemText primary="Low-cost ETF allocation" />
                      </ListItem>
                    </List>
                    <Button variant="outlined" fullWidth sx={{ mt: 2 }}>
                      Enable Smart Rebalancing
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Timeline sx={{ mr: 1, color: 'success.main' }} />
                      <Typography variant="h6">AI Insights & Alerts</Typography>
                    </Box>
                    <Typography variant="body2" paragraph>
                      Receive personalized market insights and trading opportunities based on our quantitative models.
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon><CheckCircle fontSize="small" color="success" /></ListItemIcon>
                        <ListItemText primary="Daily market analysis" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CheckCircle fontSize="small" color="success" /></ListItemIcon>
                        <ListItemText primary="Sector rotation signals" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CheckCircle fontSize="small" color="success" /></ListItemIcon>
                        <ListItemText primary="Risk management alerts" />
                      </ListItem>
                    </List>
                    <Button variant="outlined" fullWidth sx={{ mt: 2 }}>
                      Enable AI Insights
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => {
                  setCompletedSteps(prev => new Set([...prev, 3]));
                  setActiveStep(4);
                }}
              >
                Continue with Recommended Strategies
              </Button>
            </Box>
          </Box>
        );

      case 4:
        return (
          <Box sx={{ textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Portfolio Setup Complete!
            </Typography>
            <Typography variant="body1" paragraph>
              Your account is now fully configured and ready for AI-powered investing.
            </Typography>
            
            <Alert severity="success" sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="body2">
                <strong>Setup Summary:</strong><br />
                • Portfolio imported and analyzed<br />
                • Investment profile configured<br />
                • Funding method established<br />
                • AI strategies activated
              </Typography>
            </Alert>

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<TrendingUp />}
                  size="large"
                >
                  View Portfolio Dashboard
                </Button>
              </Grid>
              <Grid item xs={12} md={4}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Analytics />}
                  size="large"
                >
                  Explore AI Insights
                </Button>
              </Grid>
              <Grid item xs={12} md={4}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<AccountBalance />}
                  size="large"
                >
                  Make First Investment
                </Button>
              </Grid>
            </Grid>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: 'white' }}>
        <CardContent sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2, width: 56, height: 56 }}>
              <Verified sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                Welcome back, {user?.name}!
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                Let's set up your investment portfolio
              </Typography>
            </Box>
          </Box>
          
          <LinearProgress 
            variant="determinate" 
            value={(completedSteps.size / steps.length) * 100}
            sx={{ 
              height: 8, 
              borderRadius: 4,
              bgcolor: 'rgba(255,255,255,0.2)',
              '& .MuiLinearProgress-bar': {
                bgcolor: 'rgba(255,255,255,0.8)'
              }
            }}
          />
          <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
            {completedSteps.size} of {steps.length} steps completed
          </Typography>
        </CardContent>
      </Card>

      {/* Stepper */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label, index) => (
              <Step key={label} completed={completedSteps.has(index)}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardContent sx={{ p: 4 }}>
          {getStepContent(activeStep)}
        </CardContent>
      </Card>

      {/* Navigation */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Button
          onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
          disabled={activeStep === 0}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={() => setActiveStep(Math.min(steps.length - 1, activeStep + 1))}
          disabled={activeStep === steps.length - 1 || !completedSteps.has(activeStep)}
        >
          Next
        </Button>
      </Box>

      {/* Funding Dialog */}
      <Dialog open={showFundingDialog} onClose={() => setShowFundingDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Credit/Debit Card</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Card Number"
                placeholder="1234 5678 9012 3456"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Expiry Date"
                placeholder="MM/YY"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="CVV"
                placeholder="123"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Cardholder Name"
                placeholder="John Smith"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Amount (AUD)"
                type="number"
                value={fundingAmount}
                onChange={(e) => setFundingAmount(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowFundingDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleFundingComplete}>
            Add Card & Fund Account
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VerifiedCustomerFlow;