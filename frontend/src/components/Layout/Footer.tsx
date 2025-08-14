import React from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Link,
  IconButton,
  Divider,
  Chip
} from '@mui/material';
import {
  Twitter,
  LinkedIn,
  GitHub,
  Email,
  Phone,
  LocationOn,
  Security,
  Policy,
  Help,
  Info
} from '@mui/icons-material';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box 
      component="footer" 
      sx={{ 
        backgroundColor: 'grey.900',
        color: 'white',
        py: 6,
        mt: 'auto'
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Company Info */}
          <Grid item xs={12} md={3}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Qlib Pro
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: 'grey.300' }}>
              Professional quantitative trading platform for Australian investors. 
              AI-powered portfolio management with institutional-grade tools.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip 
                label="AUSTRAC Compliant" 
                size="small" 
                color="primary"
                icon={<Security />}
              />
            </Box>
          </Grid>

          {/* Platform Links */}
          <Grid item xs={12} md={2}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Platform
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="/dashboard" color="grey.300" underline="hover">
                Dashboard
              </Link>
              <Link href="/models" color="grey.300" underline="hover">
                AI Models
              </Link>
              <Link href="/portfolio" color="grey.300" underline="hover">
                Portfolio
              </Link>
              <Link href="/backtesting" color="grey.300" underline="hover">
                Backtesting
              </Link>
              <Link href="/data" color="grey.300" underline="hover">
                Market Data
              </Link>
            </Box>
          </Grid>

          {/* Support Links */}
          <Grid item xs={12} md={2}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Support
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="/help" color="grey.300" underline="hover" sx={{ display: 'flex', alignItems: 'center' }}>
                <Help sx={{ fontSize: 16, mr: 0.5 }} />
                Help Center
              </Link>
              <Link href="/faq" color="grey.300" underline="hover">
                FAQ
              </Link>
              <Link href="/contact" color="grey.300" underline="hover">
                Contact Us
              </Link>
              <Link href="/tutorials" color="grey.300" underline="hover">
                Tutorials
              </Link>
              <Link href="/api-docs" color="grey.300" underline="hover">
                API Documentation
              </Link>
            </Box>
          </Grid>

          {/* Company Links */}
          <Grid item xs={12} md={2}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Company
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="/about" color="grey.300" underline="hover" sx={{ display: 'flex', alignItems: 'center' }}>
                <Info sx={{ fontSize: 16, mr: 0.5 }} />
                About Us
              </Link>
              <Link href="/careers" color="grey.300" underline="hover">
                Careers
              </Link>
              <Link href="/investors" color="grey.300" underline="hover">
                Investors
              </Link>
              <Link href="/news" color="grey.300" underline="hover">
                News
              </Link>
              <Link href="/blog" color="grey.300" underline="hover">
                Blog
              </Link>
            </Box>
          </Grid>

          {/* Legal & Contact */}
          <Grid item xs={12} md={3}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Legal & Contact
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
              <Link href="/terms" color="grey.300" underline="hover" sx={{ display: 'flex', alignItems: 'center' }}>
                <Policy sx={{ fontSize: 16, mr: 0.5 }} />
                Terms of Service
              </Link>
              <Link href="/privacy" color="grey.300" underline="hover">
                Privacy Policy
              </Link>
              <Link href="/security" color="grey.300" underline="hover">
                Security
              </Link>
              <Link href="/compliance" color="grey.300" underline="hover">
                Compliance
              </Link>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5, color: 'grey.300' }}>
                <Email sx={{ fontSize: 16, mr: 0.5 }} />
                support@qlibpro.com
              </Typography>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5, color: 'grey.300' }}>
                <Phone sx={{ fontSize: 16, mr: 0.5 }} />
                +61 2 8123 4567
              </Typography>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', color: 'grey.300' }}>
                <LocationOn sx={{ fontSize: 16, mr: 0.5 }} />
                Sydney, Australia
              </Typography>
            </Box>

            {/* Social Media */}
            <Box>
              <Typography variant="body2" gutterBottom sx={{ color: 'grey.300' }}>
                Follow Us
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton 
                  href="https://twitter.com/qlibpro" 
                  target="_blank"
                  sx={{ color: 'grey.300', '&:hover': { color: '#1DA1F2' } }}
                >
                  <Twitter />
                </IconButton>
                <IconButton 
                  href="https://linkedin.com/company/qlibpro" 
                  target="_blank"
                  sx={{ color: 'grey.300', '&:hover': { color: '#0077B5' } }}
                >
                  <LinkedIn />
                </IconButton>
                <IconButton 
                  href="https://github.com/qlibpro" 
                  target="_blank"
                  sx={{ color: 'grey.300', '&:hover': { color: '#333' } }}
                >
                  <GitHub />
                </IconButton>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, borderColor: 'grey.700' }} />

        {/* Bottom Bar */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body2" sx={{ color: 'grey.400' }}>
            © {currentYear} Qlib Pro. All rights reserved. Australian Financial Services License holder.
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="caption" sx={{ color: 'grey.500' }}>
              AFSL 123456 • AUSTRAC DCE100123456
            </Typography>
            <Chip 
              label="ISO 27001 Certified" 
              size="small" 
              variant="outlined"
              sx={{ 
                borderColor: 'grey.600',
                color: 'grey.300',
                fontSize: '0.7rem'
              }}
            />
          </Box>
        </Box>

        {/* Disclaimer */}
        <Box sx={{ mt: 3, p: 2, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
          <Typography variant="caption" sx={{ color: 'grey.400', display: 'block' }}>
            <strong>Disclaimer:</strong> Trading involves risk of loss. Past performance does not guarantee future results. 
            AI recommendations are not financial advice. Consider your objectives and seek professional advice. 
            Qlib Pro Pty Ltd is regulated by ASIC and complies with Australian financial services laws.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;