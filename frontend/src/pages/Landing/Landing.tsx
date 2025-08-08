import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  IconButton,
  useTheme,
  alpha,
} from '@mui/material';
import {
  TrendingUp,
  Security,
  AutoAwesome,
  PlayArrow,
  ArrowForward,
  Star,
  ChevronLeft,
  ChevronRight,
  Shield,
  EmojiEvents,
  People,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Landing: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Teacher, San Francisco",
      avatar: "SC",
      profit: "+$12,450",
      timeframe: "Last 3 months",
      quote: "I knew nothing about stocks. The AI picked everything and I made more than my savings account in 5 years!",
      rating: 5,
    },
    {
      name: "Mike Rodriguez", 
      role: "Engineer, Austin",
      avatar: "MR",
      profit: "+$8,230",
      timeframe: "Last 2 months",
      quote: "Started with paper trading, then invested $5K. The AI explanations helped me learn while earning.",
      rating: 5,
    },
    {
      name: "Jennifer Park",
      role: "Nurse, Seattle",
      avatar: "JP", 
      profit: "+$15,670",
      timeframe: "Last 4 months",
      quote: "My portfolio is up 31%! The AI found opportunities I would never have seen myself.",
      rating: 5,
    },
  ];

  const features = [
    {
      icon: <AutoAwesome sx={{ fontSize: 40, color: '#4CAF50' }} />,
      title: "AI Picks Your Stocks",
      description: "Our AI analyzes thousands of data points to find the best opportunities for you.",
    },
    {
      icon: <Shield sx={{ fontSize: 40, color: '#2196F3' }} />,
      title: "Start Risk-Free",
      description: "Practice with virtual money first. No risk until you're ready.",
    },
    {
      icon: <TrendingUp sx={{ fontSize: 40, color: '#FF9800' }} />,
      title: "Real Results",
      description: "Join 15,000+ users who've grown their wealth with AI-powered investing.",
    },
  ];

  const stats = [
    { label: "Average Returns", value: "24.7%" },
    { label: "Success Rate", value: "87%" },
    { label: "Happy Users", value: "15,247" },
  ];

  const nextTestimonial = () => {
    setTestimonialIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setTestimonialIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${alpha('#4CAF50', 0.1)} 0%, ${alpha('#2196F3', 0.1)} 100%)`,
          pt: 8,
          pb: 6,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                <Chip
                  label="🚀 AI-Powered Investing"
                  sx={{
                    bgcolor: alpha('#4CAF50', 0.1),
                    color: '#4CAF50',
                    fontWeight: 600,
                    mb: 2,
                  }}
                />
                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: 700,
                    mb: 2,
                    fontSize: { xs: '2.5rem', md: '3.5rem' },
                    background: 'linear-gradient(45deg, #4CAF50, #2196F3)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  AI Made Me $12,450 Last Month
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ mb: 4, color: 'text.secondary', lineHeight: 1.6 }}
                >
                  Join thousands of everyday people growing their wealth with AI. 
                  No experience needed. Start with paper trading - completely risk-free.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: { xs: 'center', md: 'flex-start' } }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate('/register')}
                    sx={{
                      bgcolor: '#4CAF50',
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      '&:hover': { bgcolor: '#45a049' },
                    }}
                    endIcon={<ArrowForward />}
                  >
                    Start Free Paper Trading
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    sx={{ px: 4, py: 1.5 }}
                    startIcon={<PlayArrow />}
                  >
                    Watch Demo
                  </Button>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Card
                  sx={{
                    maxWidth: 400,
                    boxShadow: theme.shadows[10],
                    background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: '#4CAF50', mr: 2 }}>SC</Avatar>
                      <Box>
                        <Typography variant="h6" fontWeight={600}>
                          Sarah Chen
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Teacher, San Francisco
                        </Typography>
                      </Box>
                    </Box>
                    <Typography
                      variant="h4"
                      sx={{ color: '#4CAF50', fontWeight: 700, mb: 1 }}
                    >
                      +$12,450
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Last 3 months
                    </Typography>
                    <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                      "I knew nothing about stocks. The AI picked everything and I made more than my savings account in 5 years!"
                    </Typography>
                    <Box sx={{ display: 'flex', mt: 2 }}>
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} sx={{ color: '#FFD700', fontSize: 20 }} />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Stats Section */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={4}>
          {stats.map((stat, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card
                sx={{
                  textAlign: 'center',
                  py: 3,
                  background: 'linear-gradient(135deg, #fff 0%, #f8f9fa 100%)',
                  border: '1px solid',
                  borderColor: alpha('#4CAF50', 0.2),
                }}
              >
                <CardContent>
                  <Typography
                    variant="h3"
                    sx={{ color: '#4CAF50', fontWeight: 700, mb: 1 }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    {stat.label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Features Section */}
      <Box sx={{ bgcolor: alpha('#f5f5f5', 0.5), py: 8 }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            sx={{ textAlign: 'center', mb: 2, fontWeight: 700 }}
          >
            How It Works
          </Typography>
          <Typography
            variant="h6"
            sx={{ textAlign: 'center', mb: 6, color: 'text.secondary' }}
          >
            Three simple steps to start growing your wealth
          </Typography>
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    textAlign: 'center',
                    p: 3,
                    transition: 'transform 0.3s ease',
                    '&:hover': { transform: 'translateY(-8px)' },
                  }}
                >
                  <CardContent>
                    <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                    <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Testimonials Carousel */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography
          variant="h3"
          sx={{ textAlign: 'center', mb: 6, fontWeight: 700 }}
        >
          Real People, Real Results
        </Typography>
        <Box sx={{ position: 'relative', maxWidth: 800, mx: 'auto' }}>
          <Card
            sx={{
              p: 4,
              textAlign: 'center',
              boxShadow: theme.shadows[8],
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                <Avatar sx={{ bgcolor: '#4CAF50', mr: 2, width: 60, height: 60 }}>
                  {testimonials[testimonialIndex].avatar}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    {testimonials[testimonialIndex].name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {testimonials[testimonialIndex].role}
                  </Typography>
                </Box>
              </Box>
              <Typography
                variant="h4"
                sx={{ color: '#4CAF50', fontWeight: 700, mb: 1 }}
              >
                {testimonials[testimonialIndex].profit}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {testimonials[testimonialIndex].timeframe}
              </Typography>
              <Typography variant="h6" sx={{ fontStyle: 'italic', mb: 3 }}>
                "{testimonials[testimonialIndex].quote}"
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                {[...Array(testimonials[testimonialIndex].rating)].map((_, i) => (
                  <Star key={i} sx={{ color: '#FFD700', fontSize: 24 }} />
                ))}
              </Box>
            </CardContent>
          </Card>
          <IconButton
            onClick={prevTestimonial}
            sx={{
              position: 'absolute',
              left: -20,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: 'white',
              boxShadow: theme.shadows[4],
            }}
          >
            <ChevronLeft />
          </IconButton>
          <IconButton
            onClick={nextTestimonial}
            sx={{
              position: 'absolute',
              right: -20,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: 'white',
              boxShadow: theme.shadows[4],
            }}
          >
            <ChevronRight />
          </IconButton>
        </Box>
      </Container>

      {/* Trust Section */}
      <Box sx={{ bgcolor: alpha('#f5f5f5', 0.5), py: 6 }}>
        <Container maxWidth="lg">
          <Typography
            variant="h4"
            sx={{ textAlign: 'center', mb: 4, fontWeight: 700 }}
          >
            Your Money is Safe
          </Typography>
          <Grid container spacing={4} justifyContent="center">
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Security sx={{ fontSize: 48, color: '#2196F3', mb: 2 }} />
                <Typography variant="h6" fontWeight={600}>
                  Bank-Level Security
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  256-bit encryption
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <EmojiEvents sx={{ fontSize: 48, color: '#4CAF50', mb: 2 }} />
                <Typography variant="h6" fontWeight={600}>
                  SEC Registered
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Fully regulated
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <People sx={{ fontSize: 48, color: '#FF9800', mb: 2 }} />
                <Typography variant="h6" fontWeight={600}>
                  15,000+ Users
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Trusted by thousands
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Card
          sx={{
            background: 'linear-gradient(135deg, #4CAF50 0%, #2196F3 100%)',
            color: 'white',
            p: 6,
            textAlign: 'center',
          }}
        >
          <CardContent>
            <Typography variant="h3" sx={{ mb: 2, fontWeight: 700 }}>
              Ready to Grow Your Wealth?
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
              Start with paper trading. No risk, no cost, real AI picks.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/register')}
              sx={{
                bgcolor: 'white',
                color: '#4CAF50',
                px: 6,
                py: 2,
                fontSize: '1.2rem',
                fontWeight: 600,
                '&:hover': { bgcolor: alpha('#ffffff', 0.9) },
              }}
              endIcon={<ArrowForward />}
            >
              Start Free Paper Trading
            </Button>
            <Typography variant="body2" sx={{ mt: 2, opacity: 0.8 }}>
              Join in 60 seconds • No credit card required
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default Landing;