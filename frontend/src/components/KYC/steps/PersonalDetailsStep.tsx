import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider
} from '@mui/material';
import { PersonAdd } from '@mui/icons-material';
import axios from 'axios';

interface PersonalDetailsStepProps {
  onNext: () => void;
  onApplicationCreate: (application: any) => void;
  onError: (error: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

interface FormData {
  username: string;
  email: string;
  phone: string;
  legal_first_name: string;
  legal_last_name: string;
  date_of_birth: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

const australianStates = [
  { value: 'NSW', label: 'New South Wales' },
  { value: 'VIC', label: 'Victoria' },
  { value: 'QLD', label: 'Queensland' },
  { value: 'WA', label: 'Western Australia' },
  { value: 'SA', label: 'South Australia' },
  { value: 'TAS', label: 'Tasmania' },
  { value: 'ACT', label: 'Australian Capital Territory' },
  { value: 'NT', label: 'Northern Territory' }
];

const PersonalDetailsStep: React.FC<PersonalDetailsStepProps> = ({
  onNext,
  onApplicationCreate,
  onError,
  loading,
  setLoading
}) => {
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    phone: '+61',
    legal_first_name: '',
    legal_last_name: '',
    date_of_birth: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: 'NSW',
    postcode: '',
    country: 'Australia'
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});

  const handleInputChange = (field: keyof FormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: string } }
  ) => {
    const value = event.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    // Required field validation
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phone || formData.phone === '+61') newErrors.phone = 'Phone number is required';
    if (!formData.legal_first_name.trim()) newErrors.legal_first_name = 'Legal first name is required';
    if (!formData.legal_last_name.trim()) newErrors.legal_last_name = 'Legal last name is required';
    if (!formData.date_of_birth) newErrors.date_of_birth = 'Date of birth is required';
    if (!formData.address_line1.trim()) newErrors.address_line1 = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.postcode.trim()) newErrors.postcode = 'Postcode is required';

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone number validation (Australian format)
    const phoneRegex = /^\+61[0-9]{9}$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid Australian phone number (+61xxxxxxxxx)';
    }

    // Postcode validation (Australian format)
    const postcodeRegex = /^[0-9]{4}$/;
    if (formData.postcode && !postcodeRegex.test(formData.postcode)) {
      newErrors.postcode = 'Please enter a valid 4-digit postcode';
    }

    // Age validation (must be 18+)
    if (formData.date_of_birth) {
      const birthDate = new Date(formData.date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        // Haven't had birthday this year yet
      }
      
      if (age < 18) {
        newErrors.date_of_birth = 'You must be at least 18 years old';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Create customer profile with unique ID
      const customerProfile = {
        id: `customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...formData
      };

      // Simulate API delay for demo
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Create mock application response for demo
      const mockApplication = {
        id: customerProfile.id,
        status: 'in_progress',
        risk_level: 'low',
        customer_profile: customerProfile,
        created_at: new Date().toISOString()
      };

      onApplicationCreate(mockApplication);
      onNext();
    } catch (error: any) {
      console.error('KYC initiation error:', error);
      onError('Failed to start verification process. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <PersonAdd sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h5">Personal Information</Typography>
      </Box>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Please provide your legal information exactly as it appears on your government-issued ID.
      </Typography>

      <Grid container spacing={3}>
        {/* Username */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Username"
            value={formData.username}
            onChange={handleInputChange('username')}
            error={!!errors.username}
            helperText={errors.username || 'Choose a unique username for your account'}
            required
          />
        </Grid>

        {/* Email */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="email"
            label="Email Address"
            value={formData.email}
            onChange={handleInputChange('email')}
            error={!!errors.email}
            helperText={errors.email || 'We\'ll send a verification code to this email'}
            required
          />
        </Grid>

        {/* Phone */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Phone Number"
            value={formData.phone}
            onChange={handleInputChange('phone')}
            error={!!errors.phone}
            helperText={errors.phone || 'Include country code (+61 for Australia)'}
            placeholder="+61423456789"
            required
          />
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Legal Information
            </Typography>
          </Divider>
        </Grid>

        {/* Legal Names */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Legal First Name"
            value={formData.legal_first_name}
            onChange={handleInputChange('legal_first_name')}
            error={!!errors.legal_first_name}
            helperText={errors.legal_first_name || 'As shown on your ID'}
            required
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Legal Last Name"
            value={formData.legal_last_name}
            onChange={handleInputChange('legal_last_name')}
            error={!!errors.legal_last_name}
            helperText={errors.legal_last_name || 'As shown on your ID'}
            required
          />
        </Grid>

        {/* Date of Birth */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="date"
            label="Date of Birth"
            value={formData.date_of_birth}
            onChange={handleInputChange('date_of_birth')}
            error={!!errors.date_of_birth}
            helperText={errors.date_of_birth || 'Must be 18 or older'}
            InputLabelProps={{ shrink: true }}
            required
          />
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Address Information
            </Typography>
          </Divider>
        </Grid>

        {/* Address */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Address Line 1"
            value={formData.address_line1}
            onChange={handleInputChange('address_line1')}
            error={!!errors.address_line1}
            helperText={errors.address_line1 || 'Street number and name'}
            required
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Address Line 2"
            value={formData.address_line2}
            onChange={handleInputChange('address_line2')}
            helperText="Apartment, suite, unit (optional)"
          />
        </Grid>

        {/* City */}
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="City"
            value={formData.city}
            onChange={handleInputChange('city')}
            error={!!errors.city}
            helperText={errors.city}
            required
          />
        </Grid>

        {/* State */}
        <Grid item xs={12} md={4}>
          <FormControl fullWidth required>
            <InputLabel>State</InputLabel>
            <Select
              value={formData.state}
              label="State"
              onChange={(e) => handleInputChange('state')(e)}
            >
              {australianStates.map((state) => (
                <MenuItem key={state.value} value={state.value}>
                  {state.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Postcode */}
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Postcode"
            value={formData.postcode}
            onChange={handleInputChange('postcode')}
            error={!!errors.postcode}
            helperText={errors.postcode}
            placeholder="2000"
            required
          />
        </Grid>

        {/* Country */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Country"
            value={formData.country}
            disabled
            helperText="Currently only available for Australian residents"
          />
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          size="large"
          sx={{ minWidth: 200 }}
        >
          {loading ? 'Creating Application...' : 'Continue to Email Verification'}
        </Button>
      </Box>
    </Box>
  );
};

export default PersonalDetailsStep;