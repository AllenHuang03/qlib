import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Container,
  Paper,
} from '@mui/material';
import {
  TrendingUp,
  Psychology,
  Security,
  Speed,
  Groups,
  School,
} from '@mui/icons-material';

export default function AboutUs() {
  const values = [
    {
      icon: <Psychology />,
      title: 'Innovation',
      description: 'Pioneering AI-driven investment solutions that democratize access to institutional-grade quantitative trading.',
    },
    {
      icon: <Security />,
      title: 'Trust & Security',
      description: 'Bank-level security with regulatory compliance, ensuring your data and investments are always protected.',
    },
    {
      icon: <Speed />,
      title: 'Performance',
      description: 'Delivering superior risk-adjusted returns through advanced machine learning and real-time market analysis.',
    },
    {
      icon: <Groups />,
      title: 'Community',
      description: 'Building a community of informed investors with educational resources and transparent insights.',
    },
  ];

  const team = [
    {
      name: 'Dr. Sarah Chen',
      role: 'CEO & Founder',
      background: 'Former Goldman Sachs Quantitative Researcher, PhD in Financial Engineering from Stanford',
      avatar: 'SC',
    },
    {
      name: 'Michael Rodriguez',
      role: 'CTO',
      background: 'Ex-Google ML Engineer, 15+ years in algorithmic trading systems at Jane Street',
      avatar: 'MR',
    },
    {
      name: 'Dr. James Wilson',
      role: 'Head of Research',
      background: 'Former Citadel Portfolio Manager, PhD in Statistics from MIT',
      avatar: 'JW',
    },
    {
      name: 'Lisa Park',
      role: 'Head of Compliance',
      background: 'Former ASIC Senior Policy Advisor, 20+ years in financial regulation',
      avatar: 'LP',
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Hero Section */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
          About Qlib Pro
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto' }}>
          Democratizing institutional-grade quantitative investing through artificial intelligence
        </Typography>
      </Box>

      {/* Mission Statement */}
      <Paper elevation={2} sx={{ p: 4, mb: 6, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom color="primary">
          Our Mission
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 900, mx: 'auto' }}>
          To make sophisticated quantitative investment strategies accessible to every investor, 
          regardless of their experience level or portfolio size, through cutting-edge AI technology 
          and transparent, educational approaches.
        </Typography>
      </Paper>

      {/* Company Story */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom textAlign="center">
          Our Story
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Typography variant="body1" paragraph>
              Founded in 2023 by a team of quantitative researchers and AI specialists from top-tier 
              financial institutions, Qlib Pro was born from a simple observation: the most profitable 
              trading strategies were locked away in hedge funds and investment banks, inaccessible 
              to everyday investors.
            </Typography>
            <Typography variant="body1" paragraph>
              Having witnessed the power of quantitative models firsthand at firms like Goldman Sachs, 
              Citadel, and Jane Street, our founders set out to democratize these institutional-grade 
              tools through artificial intelligence and user-friendly interfaces.
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body1" paragraph>
              Today, Qlib Pro serves thousands of investors across Australia and internationally, 
              providing AI-powered insights, automated portfolio management, and educational resources 
              that bridge the gap between retail and institutional investing.
            </Typography>
            <Typography variant="body1" paragraph>
              We're not just building investment tools—we're creating a new paradigm where every 
              investor can benefit from the same quantitative advantages previously reserved for 
              Wall Street professionals.
            </Typography>
          </Grid>
        </Grid>
      </Box>

      {/* Our Values */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom textAlign="center">
          Our Values
        </Typography>
        <Grid container spacing={3}>
          {values.map((value, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{ height: '100%', textAlign: 'center' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ color: 'primary.main', mb: 2 }}>
                    {React.cloneElement(value.icon, { sx: { fontSize: 48 } })}
                  </Box>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    {value.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {value.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Leadership Team */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom textAlign="center">
          Leadership Team
        </Typography>
        <Grid container spacing={3}>
          {team.map((member, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{ textAlign: 'center' }}>
                <CardContent sx={{ p: 3 }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      mx: 'auto',
                      mb: 2,
                      bgcolor: 'primary.main',
                      fontSize: '1.5rem',
                    }}
                  >
                    {member.avatar}
                  </Avatar>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    {member.name}
                  </Typography>
                  <Typography variant="subtitle1" color="primary" gutterBottom>
                    {member.role}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {member.background}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Company Stats */}
      <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          By the Numbers
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} sm={3}>
            <Typography variant="h3" color="primary" fontWeight="bold">
              $2.5B+
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Assets Under Management
            </Typography>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Typography variant="h3" color="primary" fontWeight="bold">
              50,000+
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Active Users Worldwide
            </Typography>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Typography variant="h3" color="primary" fontWeight="bold">
              18.5%
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Average Annual Return
            </Typography>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Typography variant="h3" color="primary" fontWeight="bold">
              1.67
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Average Sharpe Ratio
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Regulatory Information */}
      <Box sx={{ mt: 6, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Regulatory Compliance
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Qlib Pro is regulated by the Australian Securities and Investments Commission (ASIC) 
          and holds an Australian Financial Services License (AFSL 543210). We are committed to 
          maintaining the highest standards of regulatory compliance and client protection.
        </Typography>
      </Box>
    </Container>
  );
}