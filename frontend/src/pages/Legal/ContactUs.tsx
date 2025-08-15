import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Container,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Email,
  Phone,
  LocationOn,
  AccessTime,
  Send,
  Support,
  Business,
  Security,
  BugReport,
} from '@mui/icons-material';

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: '',
    message: '',
  });
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate form submission
    console.log('Contact form submitted:', formData);
    setSubmitSuccess(true);
    setFormData({ name: '', email: '', subject: '', category: '', message: '' });
  };

  const contactInfo = [
    {
      icon: <Email />,
      title: 'Email Support',
      content: 'support@qlibpro.com',
      subtitle: '24/7 Support Available',
    },
    {
      icon: <Phone />,
      title: 'Phone Support',
      content: '+61 2 9000 1234',
      subtitle: 'Mon-Fri 8AM-8PM AEST',
    },
    {
      icon: <LocationOn />,
      title: 'Head Office',
      content: 'Level 15, 1 Martin Place\nSydney NSW 2000, Australia',
      subtitle: 'Visit by appointment only',
    },
    {
      icon: <AccessTime />,
      title: 'Response Time',
      content: '< 2 hours',
      subtitle: 'Average response time',
    },
  ];

  const supportCategories = [
    {
      icon: <Support />,
      title: 'General Support',
      description: 'Account issues, platform navigation, general questions',
      email: 'support@qlibpro.com',
    },
    {
      icon: <Business />,
      title: 'Enterprise Sales',
      description: 'Institutional accounts, custom solutions, partnerships',
      email: 'sales@qlibpro.com',
    },
    {
      icon: <Security />,
      title: 'Security & Compliance',
      description: 'Security issues, regulatory questions, compliance matters',
      email: 'security@qlibpro.com',
    },
    {
      icon: <BugReport />,
      title: 'Technical Issues',
      description: 'Platform bugs, API issues, technical difficulties',
      email: 'technical@qlibpro.com',
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
          Contact Us
        </Typography>
        <Typography variant="h5" color="text.secondary">
          We're here to help with any questions about your investment journey
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Contact Form */}
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom>
              Send us a Message
            </Typography>
            
            {submitSuccess && (
              <Alert severity="success" sx={{ mb: 3 }}>
                Thank you for your message! We'll get back to you within 2 hours.
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={formData.category}
                      label="Category"
                      onChange={(e) => handleInputChange('category', e.target.value)}
                    >
                      <MenuItem value="general">General Support</MenuItem>
                      <MenuItem value="technical">Technical Issue</MenuItem>
                      <MenuItem value="account">Account Question</MenuItem>
                      <MenuItem value="billing">Billing & Subscription</MenuItem>
                      <MenuItem value="security">Security Concern</MenuItem>
                      <MenuItem value="feedback">Feature Request</MenuItem>
                      <MenuItem value="enterprise">Enterprise Inquiry</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Subject"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Message"
                    multiline
                    rows={6}
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    placeholder="Please describe your question or issue in detail..."
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    startIcon={<Send />}
                    disabled={!formData.name || !formData.email || !formData.category || !formData.message}
                  >
                    Send Message
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>

        {/* Contact Information */}
        <Grid item xs={12} md={4}>
          <Grid container spacing={3}>
            {contactInfo.map((info, index) => (
              <Grid item xs={12} key={index}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ color: 'primary.main', mr: 2 }}>
                        {info.icon}
                      </Box>
                      <Typography variant="h6" fontWeight="bold">
                        {info.title}
                      </Typography>
                    </Box>
                    <Typography variant="body1" gutterBottom>
                      {info.content}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {info.subtitle}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>

      {/* Support Categories */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h4" gutterBottom textAlign="center">
          Specialized Support Teams
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
          Choose the right team for faster, more specialized assistance
        </Typography>
        
        <Grid container spacing={3}>
          {supportCategories.map((category, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Box sx={{ color: 'primary.main', mb: 2 }}>
                    {React.cloneElement(category.icon, { sx: { fontSize: 40 } })}
                  </Box>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    {category.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {category.description}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" fontWeight="medium">
                    {category.email}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* FAQ Link */}
      <Paper elevation={2} sx={{ p: 4, mt: 6, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Looking for Quick Answers?
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Check our comprehensive FAQ section for instant answers to common questions
        </Typography>
        <Button variant="outlined" size="large">
          Visit FAQ Center
        </Button>
      </Paper>

      {/* Operating Hours */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Support Operating Hours
        </Typography>
        <List sx={{ maxWidth: 400, mx: 'auto' }}>
          <ListItem>
            <ListItemText 
              primary="Email Support" 
              secondary="24/7 - Responses within 2 hours"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Phone Support" 
              secondary="Monday - Friday: 8:00 AM - 8:00 PM AEST"
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Live Chat" 
              secondary="Monday - Friday: 9:00 AM - 6:00 PM AEST"
            />
          </ListItem>
        </List>
      </Box>
    </Container>
  );
}