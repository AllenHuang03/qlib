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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';

export default function TermsOfService() {
  const subscriptionTiers = [
    { tier: 'Free', monthlyFee: '$0', features: 'Basic portfolio tracking, limited AI insights' },
    { tier: 'Professional', monthlyFee: '$49', features: 'Full AI insights, advanced analytics, priority support' },
    { tier: 'Enterprise', monthlyFee: 'Custom', features: 'White-label solutions, API access, dedicated support' },
  ];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
            Terms of Service
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Last Updated: January 12, 2024
          </Typography>
        </Box>

        <Alert severity="warning" sx={{ mb: 4 }}>
          <Typography variant="body2">
            <strong>Important:</strong> These Terms of Service constitute a legally binding agreement. 
            Please read them carefully before using our services. By using Qlib Pro, you agree to these terms.
          </Typography>
        </Alert>

        {/* Section 1 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            1. Acceptance of Terms
          </Typography>
          
          <Typography variant="body1" paragraph>
            By accessing or using the Qlib Pro platform, you agree to be bound by these Terms of Service 
            and all applicable laws and regulations. If you do not agree with any of these terms, you are 
            prohibited from using or accessing this site and our services.
          </Typography>
          
          <Typography variant="body1" paragraph>
            These terms apply to all users of the platform, including visitors, registered users, 
            and subscribers to our paid services.
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Section 2 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            2. Service Description
          </Typography>
          
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            2.1 Platform Services
          </Typography>
          <Typography variant="body1" paragraph>
            Qlib Pro provides AI-powered investment analysis and portfolio management tools including:
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="Artificial intelligence-driven investment recommendations" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Portfolio analysis and optimization tools" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Market data and sentiment analysis" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Educational resources and investment guidance" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Paper trading simulation environment" />
            </ListItem>
          </List>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            2.2 Investment Disclaimer
          </Typography>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>IMPORTANT:</strong> Qlib Pro provides investment analysis tools and educational content only. 
              We do not provide personal financial advice. All investment decisions are your responsibility.
            </Typography>
          </Alert>
          <Typography variant="body1" paragraph>
            Our AI-generated recommendations are based on quantitative analysis and should not be considered 
            personal financial advice. Past performance does not guarantee future results. You should consider 
            seeking independent financial advice before making investment decisions.
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Section 3 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            3. User Accounts and Registration
          </Typography>
          
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            3.1 Account Creation
          </Typography>
          <Typography variant="body1" paragraph>
            To use certain features of our platform, you must create an account and complete our 
            Know Your Customer (KYC) verification process, which includes:
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="Identity verification using government-issued identification" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Address verification" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Financial experience assessment" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Risk tolerance evaluation" />
            </ListItem>
          </List>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            3.2 Account Responsibilities
          </Typography>
          <List>
            <ListItem>
              <ListItemText 
                primary="Accuracy" 
                secondary="You must provide accurate, current, and complete information"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Security" 
                secondary="You are responsible for maintaining the confidentiality of your account credentials"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Updates" 
                secondary="You must promptly update your information when it changes"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Authorized Use" 
                secondary="Your account is for your personal use only and cannot be shared or transferred"
              />
            </ListItem>
          </List>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Section 4 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            4. Subscription Plans and Billing
          </Typography>
          
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            4.1 Subscription Tiers
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Tier</strong></TableCell>
                  <TableCell><strong>Monthly Fee</strong></TableCell>
                  <TableCell><strong>Features</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {subscriptionTiers.map((tier, index) => (
                  <TableRow key={index}>
                    <TableCell>{tier.tier}</TableCell>
                    <TableCell>{tier.monthlyFee}</TableCell>
                    <TableCell>{tier.features}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            4.2 Billing Terms
          </Typography>
          <List>
            <ListItem>
              <ListItemText 
                primary="Automatic Renewal" 
                secondary="Subscriptions automatically renew monthly unless cancelled"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Payment Methods" 
                secondary="We accept major credit cards and bank transfers"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Price Changes" 
                secondary="We reserve the right to change pricing with 30 days' notice"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Refunds" 
                secondary="No refunds for partial months, but you can cancel anytime"
              />
            </ListItem>
          </List>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Section 5 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            5. Acceptable Use Policy
          </Typography>
          
          <Typography variant="body1" paragraph>
            You agree not to use our platform for any unlawful or prohibited activities, including:
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="Market manipulation or insider trading" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Attempting to reverse engineer our AI algorithms" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Sharing account credentials or sublicensing access" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Using automated systems to access our platform without permission" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Transmitting malicious code or attempting to compromise platform security" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Violating any applicable laws or regulations" />
            </ListItem>
          </List>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Section 6 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            6. Intellectual Property Rights
          </Typography>
          
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            6.1 Our Content
          </Typography>
          <Typography variant="body1" paragraph>
            All content on the Qlib Pro platform, including AI algorithms, analysis tools, educational 
            materials, and user interfaces, are protected by copyright, trademark, and other intellectual 
            property laws. You may not copy, modify, distribute, or create derivative works without our 
            written permission.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            6.2 User Data
          </Typography>
          <Typography variant="body1" paragraph>
            You retain ownership of your personal data and investment information. However, you grant us 
            a license to use aggregated, anonymized data to improve our AI models and services.
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Section 7 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            7. Risk Disclosure
          </Typography>
          
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Investment Risk Warning
            </Typography>
            <Typography variant="body2">
              All investments carry risk, including the potential for loss of principal. Past performance 
              does not guarantee future results. Our AI recommendations are based on quantitative analysis 
              and may not account for all market factors.
            </Typography>
          </Alert>

          <Typography variant="body1" paragraph>
            Specific risks include but are not limited to:
          </Typography>
          <List>
            <ListItem>
              <ListItemText 
                primary="Market Risk" 
                secondary="Asset values may fluctuate due to market conditions"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Technology Risk" 
                secondary="AI algorithms may produce unexpected or erroneous results"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Liquidity Risk" 
                secondary="Some investments may be difficult to sell quickly"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Regulatory Risk" 
                secondary="Changes in laws or regulations may affect investments"
              />
            </ListItem>
          </List>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Section 8 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            8. Limitation of Liability
          </Typography>
          
          <Typography variant="body1" paragraph>
            To the maximum extent permitted by law, Qlib Pro and its affiliates, directors, employees, 
            and agents shall not be liable for any indirect, incidental, special, consequential, or 
            punitive damages, including but not limited to:
          </Typography>
          <List>
            <ListItem>
              <ListItemText primary="Investment losses or missed opportunities" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Loss of profits or data" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Business interruption" />
            </ListItem>
            <ListItem>
              <ListItemText primary="System downtime or technical failures" />
            </ListItem>
          </List>
          
          <Typography variant="body1" paragraph sx={{ mt: 2 }}>
            Our total liability to you for any claims arising from these terms or your use of our 
            services shall not exceed the amount you paid us in the 12 months preceding the claim.
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Section 9 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            9. Termination
          </Typography>
          
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            9.1 Termination by You
          </Typography>
          <Typography variant="body1" paragraph>
            You may terminate your account at any time by contacting our support team. Upon termination, 
            your access to paid features will end at the conclusion of your current billing cycle.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            9.2 Termination by Us
          </Typography>
          <Typography variant="body1" paragraph>
            We may suspend or terminate your account immediately if you violate these terms, engage in 
            fraudulent activity, or for any other reason at our sole discretion. We will provide notice 
            when practical.
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Section 10 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            10. Governing Law and Disputes
          </Typography>
          
          <Typography variant="body1" paragraph>
            These terms are governed by the laws of New South Wales, Australia. Any disputes arising 
            from these terms or your use of our services shall be resolved through binding arbitration 
            in Sydney, Australia, except for claims that may be brought in small claims court.
          </Typography>
          
          <Typography variant="body1" paragraph>
            Before initiating arbitration, you agree to first contact us to attempt to resolve the 
            dispute informally.
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Section 11 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            11. Changes to Terms
          </Typography>
          
          <Typography variant="body1" paragraph>
            We reserve the right to modify these Terms of Service at any time. We will notify users 
            of material changes via email or platform notification. Your continued use of our services 
            after such notification constitutes acceptance of the modified terms.
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Contact Information */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            12. Contact Information
          </Typography>
          
          <Typography variant="body1" paragraph>
            If you have questions about these Terms of Service, please contact us:
          </Typography>
          
          <Paper elevation={1} sx={{ p: 3, bgcolor: 'grey.50' }}>
            <Typography variant="body1" paragraph>
              <strong>Legal Department</strong><br />
              Qlib Pro Pty Ltd<br />
              Level 15, 1 Martin Place<br />
              Sydney NSW 2000, Australia<br />
              ABN: 12 345 678 901
            </Typography>
            <Typography variant="body1" paragraph>
              <strong>Email:</strong> legal@qlibpro.com<br />
              <strong>Phone:</strong> +61 2 9000 1234
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>AFSL:</strong> 543210 | <strong>ACN:</strong> 123 456 789
            </Typography>
          </Paper>
        </Box>

        {/* Footer */}
        <Alert severity="info">
          <Typography variant="body2">
            <strong>Effective Date:</strong> These terms are effective as of January 12, 2024, and 
            supersede all prior versions. By continuing to use Qlib Pro after this date, you agree 
            to these updated terms.
          </Typography>
        </Alert>
      </Paper>
    </Container>
  );
}