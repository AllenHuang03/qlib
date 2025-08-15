import React from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  Alert,
} from '@mui/material';

export default function PrivacyPolicy() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
            Privacy Policy
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Last Updated: January 12, 2024
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 4 }}>
          This Privacy Policy explains how Qlib Pro collects, uses, and protects your personal information 
          in accordance with Australian privacy laws including the Privacy Act 1988 (Cth).
        </Alert>

        {/* Section 1 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            1. Information We Collect
          </Typography>
          
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            1.1 Personal Information
          </Typography>
          <Typography variant="body1" paragraph>
            We collect personal information that you provide to us, including:
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="Name, email address, phone number, and postal address" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Date of birth and government-issued identification" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Financial information including bank account details and investment experience" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Employment information and income details" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Investment preferences and risk tolerance" />
            </ListItem>
          </List>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            1.2 Technical Information
          </Typography>
          <Typography variant="body1" paragraph>
            We automatically collect certain technical information when you use our platform:
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="Device information (IP address, browser type, operating system)" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Usage data (pages visited, time spent, features used)" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Trading and investment activity data" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Cookies and similar tracking technologies" />
            </ListItem>
          </List>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Section 2 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            2. How We Use Your Information
          </Typography>
          
          <Typography variant="body1" paragraph>
            We use your personal information for the following purposes:
          </Typography>
          <List>
            <ListItem>
              <ListItemText 
                primary="Service Provision" 
                secondary="To provide investment services, execute trades, and manage your account"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="AI Model Training" 
                secondary="To improve our AI algorithms and provide personalized investment recommendations"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Regulatory Compliance" 
                secondary="To comply with KYC/AML requirements and other regulatory obligations"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Risk Management" 
                secondary="To assess and manage investment risks and platform security"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Communication" 
                secondary="To send important updates, market insights, and customer support"
              />
            </ListItem>
          </List>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Section 3 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            3. Information Sharing and Disclosure
          </Typography>
          
          <Typography variant="body1" paragraph>
            We may share your information with the following parties:
          </Typography>
          
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            3.1 Service Providers
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="Third-party brokers and custodians for trade execution" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Cloud hosting providers for data storage and processing" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Identity verification and compliance service providers" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Payment processors for subscription and transaction processing" />
            </ListItem>
          </List>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            3.2 Regulatory Bodies
          </Typography>
          <Typography variant="body1" paragraph>
            We may disclose your information to regulatory authorities including ASIC, AUSTRAC, 
            and other government agencies as required by law or regulation.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            3.3 Legal Requirements
          </Typography>
          <Typography variant="body1" paragraph>
            We may disclose your information when required by law, court order, or to protect 
            our rights, property, or safety, or that of our users or the public.
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Section 4 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            4. Data Security
          </Typography>
          
          <Typography variant="body1" paragraph>
            We implement industry-standard security measures to protect your information:
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="256-bit SSL encryption for all data transmission" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Multi-factor authentication for account access" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Regular security audits and penetration testing" />
            </ListItem>
            <ListItem>
              <ListItemText primary="SOC 2 Type II compliant data centers" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Employee background checks and security training" />
            </ListItem>
          </List>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Section 5 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            5. Your Rights
          </Typography>
          
          <Typography variant="body1" paragraph>
            Under Australian privacy law, you have the following rights:
          </Typography>
          <List>
            <ListItem>
              <ListItemText 
                primary="Access" 
                secondary="Request access to your personal information we hold"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Correction" 
                secondary="Request correction of inaccurate or incomplete information"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Deletion" 
                secondary="Request deletion of your personal information (subject to legal requirements)"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Complaint" 
                secondary="Lodge a complaint about our handling of your personal information"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Opt-out" 
                secondary="Opt-out of marketing communications at any time"
              />
            </ListItem>
          </List>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Section 6 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            6. Data Retention
          </Typography>
          
          <Typography variant="body1" paragraph>
            We retain your personal information for as long as necessary to:
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="Provide our services to you" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Comply with legal and regulatory requirements (typically 7 years)" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Resolve disputes and enforce our agreements" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Improve our AI models and services (in aggregated, anonymized form)" />
            </ListItem>
          </List>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Section 7 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            7. International Data Transfers
          </Typography>
          
          <Typography variant="body1" paragraph>
            Your personal information may be transferred to and processed in countries outside Australia, 
            including the United States and Singapore, where our cloud service providers operate. 
            We ensure these transfers comply with Australian privacy laws and implement appropriate 
            safeguards to protect your information.
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Section 8 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            8. Cookies and Tracking
          </Typography>
          
          <Typography variant="body1" paragraph>
            We use cookies and similar technologies to:
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="Remember your preferences and login status" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Analyze platform usage and improve user experience" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Provide personalized content and recommendations" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Detect and prevent fraud and security threats" />
            </ListItem>
          </List>
          
          <Typography variant="body1" paragraph sx={{ mt: 2 }}>
            You can control cookies through your browser settings, but disabling certain cookies 
            may affect platform functionality.
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Section 9 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            9. Changes to This Policy
          </Typography>
          
          <Typography variant="body1" paragraph>
            We may update this Privacy Policy from time to time. We will notify you of any 
            material changes by email or through our platform. Your continued use of our services 
            after such changes constitutes acceptance of the updated policy.
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Contact Information */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            10. Contact Us
          </Typography>
          
          <Typography variant="body1" paragraph>
            If you have questions about this Privacy Policy or want to exercise your privacy rights, 
            please contact us:
          </Typography>
          
          <Paper elevation={1} sx={{ p: 3, bgcolor: 'grey.50' }}>
            <Typography variant="body1" paragraph>
              <strong>Privacy Officer</strong><br />
              Qlib Pro Pty Ltd<br />
              Level 15, 1 Martin Place<br />
              Sydney NSW 2000, Australia
            </Typography>
            <Typography variant="body1" paragraph>
              <strong>Email:</strong> privacy@qlibpro.com<br />
              <strong>Phone:</strong> +61 2 9000 1234
            </Typography>
          </Paper>
        </Box>

        {/* Footer */}
        <Alert severity="info">
          <Typography variant="body2">
            <strong>Office of the Australian Information Commissioner (OAIC):</strong> If you're not 
            satisfied with our response to your privacy complaint, you can contact the OAIC at 
            www.oaic.gov.au or 1300 363 992.
          </Typography>
        </Alert>
      </Paper>
    </Container>
  );
}