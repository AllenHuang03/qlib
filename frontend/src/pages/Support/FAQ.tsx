import React, { useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  InputAdornment,
  Paper,
  Chip,
  Grid,
  Alert,
  Button,
} from '@mui/material';
import {
  ExpandMore,
  Search,
  AccountBalance,
  Security,
  TrendingUp,
  Settings,
  Help,
  Payment,
} from '@mui/icons-material';

export default function FAQ() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All Questions', icon: <Help /> },
    { id: 'getting-started', label: 'Getting Started', icon: <AccountBalance /> },
    { id: 'security', label: 'Security & KYC', icon: <Security /> },
    { id: 'investing', label: 'AI Investing', icon: <TrendingUp /> },
    { id: 'billing', label: 'Billing & Plans', icon: <Payment /> },
    { id: 'technical', label: 'Technical', icon: <Settings /> },
  ];

  const faqs = [
    {
      category: 'getting-started',
      question: 'How do I get started with Qlib Pro?',
      answer: 'Getting started is easy! First, create an account and complete our KYC verification process. This involves providing identification documents and answering questions about your investment experience. Once verified (typically within 24 hours), you can choose a subscription plan and start using our AI-powered investment tools.',
    },
    {
      category: 'getting-started',
      question: 'What is the difference between Paper Trading and real investing?',
      answer: 'Paper Trading is our risk-free simulation environment where you can practice with virtual money ($100,000 starting balance). It uses real market data and our AI recommendations, but no actual money is invested. This is perfect for learning our platform and testing strategies before investing real capital.',
    },
    {
      category: 'security',
      question: 'What documents do I need for KYC verification?',
      answer: 'You\'ll need: (1) Government-issued photo ID (passport, driver\'s license, or national ID), (2) Proof of address dated within the last 3 months (utility bill, bank statement, or rental agreement), (3) Bank account details for fund transfers. Our verification process typically takes 12-24 hours.',
    },
    {
      category: 'security',
      question: 'How secure is my personal and financial information?',
      answer: 'We use bank-level security measures including 256-bit SSL encryption, multi-factor authentication, and SOC 2 Type II compliant data centers. Your data is never shared with third parties except as required by law. We\'re regulated by ASIC and comply with all Australian privacy laws.',
    },
    {
      category: 'investing',
      question: 'How does your AI generate investment recommendations?',
      answer: 'Our AI analyzes multiple data sources including market prices, trading volumes, news sentiment, earnings data, and technical indicators. It uses machine learning models trained on historical market data to identify patterns and generate recommendations. Each recommendation comes with a confidence score and detailed explanation.',
    },
    {
      category: 'investing',
      question: 'What types of investments can I make through Qlib Pro?',
      answer: 'Currently, we focus on Australian equities (ASX-listed stocks) and ETFs. Our AI provides recommendations for individual stocks and portfolio rebalancing. We\'re planning to add international equities, bonds, and cryptocurrencies in future updates. All investments are executed through our licensed broker partners.',
    },
    {
      category: 'investing',
      question: 'Can I override AI recommendations and make my own investment decisions?',
      answer: 'Absolutely! Our AI provides recommendations and insights, but you maintain full control over all investment decisions. You can choose to follow, modify, or ignore any recommendation. Our tools are designed to inform and assist, not replace your judgment.',
    },
    {
      category: 'billing',
      question: 'What are the different subscription plans?',
      answer: 'We offer three plans: FREE ($0/month) includes basic portfolio tracking and limited AI insights. PROFESSIONAL ($49/month) includes full AI recommendations, advanced analytics, and priority support. ENTERPRISE (custom pricing) includes white-label solutions, API access, and dedicated support for institutions.',
    },
    {
      category: 'billing',
      question: 'Can I cancel my subscription anytime?',
      answer: 'Yes, you can cancel anytime without penalties. When you cancel, you\'ll retain access to paid features until the end of your current billing cycle. Your account will then revert to the free plan. You can reactivate your subscription at any time.',
    },
    {
      category: 'billing',
      question: 'Do you offer refunds?',
      answer: 'We don\'t offer refunds for partial months, but you can cancel anytime to avoid future charges. If you\'re not satisfied with our service, please contact support within 7 days of signup for a potential refund consideration on a case-by-case basis.',
    },
    {
      category: 'technical',
      question: 'What browsers and devices are supported?',
      answer: 'Qlib Pro works on all modern browsers (Chrome, Firefox, Safari, Edge) and is fully responsive for mobile and tablet use. We recommend using the latest browser version for the best experience. Our mobile apps for iOS and Android are coming soon.',
    },
    {
      category: 'technical',
      question: 'How often is market data updated?',
      answer: 'Market data is updated in real-time during trading hours. Our AI models are retrained nightly with the latest market data. Portfolio values and recommendations are updated continuously during market hours, with major model updates happening after market close.',
    },
    {
      category: 'investing',
      question: 'What is the minimum amount needed to start investing?',
      answer: 'There\'s no minimum investment amount required by Qlib Pro. However, our broker partners may have minimum trade amounts (typically $500 per transaction). We recommend starting with an amount you can afford to lose, as all investments carry risk.',
    },
    {
      category: 'security',
      question: 'What happens if I forget my password?',
      answer: 'Click "Forgot Password" on the login page and enter your email. We\'ll send you a secure reset link. For additional security, you may need to verify your identity if you haven\'t logged in recently. Contact support if you need assistance.',
    },
    {
      category: 'technical',
      question: 'Can I export my data and reports?',
      answer: 'Yes, Professional and Enterprise subscribers can export portfolio data, performance reports, and AI recommendations in CSV, PDF, and Excel formats. This includes historical data, trade confirmations, and tax reporting documents.',
    },
  ];

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
          Frequently Asked Questions
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
          Find answers to common questions about Qlib Pro
        </Typography>

        {/* Search */}
        <Box sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}>
          <TextField
            fullWidth
            placeholder="Search FAQ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Box>

      {/* Category Filter */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Filter by Category
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
          {categories.map((category) => (
            <Chip
              key={category.id}
              icon={category.icon}
              label={category.label}
              onClick={() => setSelectedCategory(category.id)}
              color={selectedCategory === category.id ? 'primary' : 'default'}
              variant={selectedCategory === category.id ? 'filled' : 'outlined'}
              clickable
            />
          ))}
        </Box>
      </Box>

      {/* Results Count */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Showing {filteredFAQs.length} of {faqs.length} questions
      </Typography>

      {/* FAQ Accordions */}
      <Box sx={{ mb: 4 }}>
        {filteredFAQs.length > 0 ? (
          filteredFAQs.map((faq, index) => (
            <Accordion key={index} sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6" fontWeight="medium">
                  {faq.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {faq.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              No matching questions found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your search terms or category filter
            </Typography>
          </Paper>
        )}
      </Box>

      {/* Popular Topics */}
      <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Popular Topics
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <Box sx={{ p: 2, border: 1, borderColor: 'grey.300', borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom>
                Account Setup
              </Typography>
              <Typography variant="body2" color="text.secondary">
                KYC verification, document requirements, getting started guide
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Box sx={{ p: 2, border: 1, borderColor: 'grey.300', borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom>
                AI Recommendations
              </Typography>
              <Typography variant="body2" color="text.secondary">
                How our AI works, confidence scores, investment strategies
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Box sx={{ p: 2, border: 1, borderColor: 'grey.300', borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom>
                Security & Privacy
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Data protection, account security, regulatory compliance
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Still Need Help */}
      <Alert severity="info" sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Still need help?
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Can't find the answer you're looking for? Our support team is here to help.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button variant="contained" size="small">
            Contact Support
          </Button>
          <Button variant="outlined" size="small">
            Submit a Ticket
          </Button>
          <Button variant="outlined" size="small">
            Live Chat
          </Button>
        </Box>
      </Alert>

      {/* Contact Information */}
      <Paper elevation={1} sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
        <Typography variant="h6" gutterBottom>
          Quick Contact
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <strong>Email:</strong> support@qlibpro.com<br />
          <strong>Phone:</strong> +61 2 9000 1234<br />
          <strong>Response Time:</strong> Usually within 2 hours
        </Typography>
      </Paper>
    </Container>
  );
}