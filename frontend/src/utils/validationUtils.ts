// Comprehensive validation utilities for customer journey flows

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface FieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

// Email validation
export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || email.trim() === '') {
    errors.push('Email address is required');
  } else if (!emailPattern.test(email)) {
    errors.push('Please enter a valid email address');
  } else if (email.length > 254) {
    errors.push('Email address is too long');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Password validation
export const validatePassword = (password: string): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!password || password.trim() === '') {
    errors.push('Password is required');
  } else {
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (password.length > 128) {
      errors.push('Password is too long (maximum 128 characters)');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      warnings.push('Consider adding special characters for better security');
    }
    
    // Check for common weak passwords
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123', 
      'password123', 'admin', 'letmein', 'welcome'
    ];
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('This password is too common. Please choose a more secure password');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// Phone number validation (Australian format)
export const validatePhoneNumber = (phone: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!phone || phone.trim() === '') {
    errors.push('Phone number is required');
  } else {
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');
    
    // Australian mobile: 04xx xxx xxx or +61 4xx xxx xxx
    // Australian landline: 0x xxxx xxxx or +61 x xxxx xxxx
    const mobilePattern = /^(\+61|0)[4][0-9]{8}$/;
    const landlinePattern = /^(\+61|0)[2378][0-9]{8}$/;
    
    if (digitsOnly.length < 10) {
      errors.push('Phone number is too short');
    } else if (digitsOnly.length > 11) {
      errors.push('Phone number is too long');
    } else if (!mobilePattern.test(digitsOnly) && !landlinePattern.test(digitsOnly)) {
      errors.push('Please enter a valid Australian phone number');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Name validation
export const validateName = (name: string, fieldName: string = 'Name'): ValidationResult => {
  const errors: string[] = [];
  
  if (!name || name.trim() === '') {
    errors.push(`${fieldName} is required`);
  } else {
    if (name.trim().length < 2) {
      errors.push(`${fieldName} must be at least 2 characters long`);
    }
    if (name.length > 50) {
      errors.push(`${fieldName} is too long (maximum 50 characters)`);
    }
    if (!/^[a-zA-Z\s\-'\.]+$/.test(name)) {
      errors.push(`${fieldName} can only contain letters, spaces, hyphens, and apostrophes`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Date validation
export const validateDate = (date: string, fieldName: string = 'Date'): ValidationResult => {
  const errors: string[] = [];
  
  if (!date || date.trim() === '') {
    errors.push(`${fieldName} is required`);
  } else {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      errors.push(`Please enter a valid ${fieldName.toLowerCase()}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Date of birth validation (18+ years old)
export const validateDateOfBirth = (dob: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!dob || dob.trim() === '') {
    errors.push('Date of birth is required');
  } else {
    const dobDate = new Date(dob);
    if (isNaN(dobDate.getTime())) {
      errors.push('Please enter a valid date of birth');
    } else {
      const today = new Date();
      const age = today.getFullYear() - dobDate.getFullYear();
      const monthDiff = today.getMonth() - dobDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
        // Haven't had birthday this year
      }
      
      if (age < 18) {
        errors.push('You must be at least 18 years old to open an account');
      }
      if (age > 120) {
        errors.push('Please enter a valid date of birth');
      }
      if (dobDate > today) {
        errors.push('Date of birth cannot be in the future');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Address validation
export const validateAddress = (address: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!address || address.trim() === '') {
    errors.push('Address is required');
  } else {
    if (address.trim().length < 5) {
      errors.push('Please enter a complete address');
    }
    if (address.length > 200) {
      errors.push('Address is too long (maximum 200 characters)');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Australian postcode validation
export const validatePostcode = (postcode: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!postcode || postcode.trim() === '') {
    errors.push('Postcode is required');
  } else {
    const postcodePattern = /^[0-9]{4}$/;
    if (!postcodePattern.test(postcode)) {
      errors.push('Please enter a valid 4-digit Australian postcode');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// TFN validation (optional but if provided, must be valid)
export const validateTFN = (tfn: string): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // TFN is optional, so empty is valid
  if (!tfn || tfn.trim() === '') {
    warnings.push('Providing your TFN helps with tax reporting');
    return {
      isValid: true,
      errors,
      warnings
    };
  }

  // Remove spaces and dashes
  const cleanTFN = tfn.replace(/[\s\-]/g, '');
  
  if (cleanTFN.length !== 9) {
    errors.push('TFN must be 9 digits');
  } else if (!/^\d{9}$/.test(cleanTFN)) {
    errors.push('TFN can only contain numbers');
  } else {
    // Basic TFN checksum validation
    const weights = [1, 4, 3, 7, 5, 8, 6, 9, 10];
    let sum = 0;
    
    for (let i = 0; i < 8; i++) {
      sum += parseInt(cleanTFN[i]) * weights[i];
    }
    
    const remainder = sum % 11;
    const checkDigit = remainder < 2 ? remainder : 11 - remainder;
    
    if (checkDigit !== parseInt(cleanTFN[8])) {
      errors.push('Please enter a valid TFN');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// File upload validation
export const validateFileUpload = (
  file: File, 
  allowedTypes: string[], 
  maxSizeMB: number = 10
): ValidationResult => {
  const errors: string[] = [];
  
  if (!file) {
    errors.push('Please select a file to upload');
  } else {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type not supported. Allowed types: ${allowedTypes.join(', ')}`);
    }
    
    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      errors.push(`File size must be less than ${maxSizeMB}MB`);
    }
    
    // Check for malicious file names
    if (/[<>:"/\\|?*]/.test(file.name)) {
      errors.push('File name contains invalid characters');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Portfolio CSV validation
export const validatePortfolioCSV = (csvData: string): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!csvData || csvData.trim() === '') {
    errors.push('CSV data is empty');
    return { isValid: false, errors };
  }

  const lines = csvData.trim().split('\n');
  
  if (lines.length < 2) {
    errors.push('CSV must contain at least a header row and one data row');
    return { isValid: false, errors };
  }

  // Check headers
  const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
  const requiredHeaders = ['symbol', 'quantity', 'price'];
  const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
  
  if (missingHeaders.length > 0) {
    errors.push(`Missing required columns: ${missingHeaders.join(', ')}`);
  }

  // Validate data rows
  for (let i = 1; i < Math.min(lines.length, 101); i++) { // Check first 100 rows
    const cells = lines[i].split(',').map(c => c.trim());
    
    if (cells.length !== headers.length) {
      errors.push(`Row ${i + 1}: Incorrect number of columns`);
      continue;
    }

    const symbolIndex = headers.indexOf('symbol');
    const quantityIndex = headers.indexOf('quantity');
    const priceIndex = headers.indexOf('price');

    if (symbolIndex >= 0 && (!cells[symbolIndex] || cells[symbolIndex] === '')) {
      errors.push(`Row ${i + 1}: Symbol is required`);
    }

    if (quantityIndex >= 0) {
      const quantity = parseFloat(cells[quantityIndex]);
      if (isNaN(quantity) || quantity <= 0) {
        errors.push(`Row ${i + 1}: Invalid quantity`);
      }
    }

    if (priceIndex >= 0) {
      const price = parseFloat(cells[priceIndex]);
      if (isNaN(price) || price <= 0) {
        errors.push(`Row ${i + 1}: Invalid price`);
      }
    }
  }

  if (lines.length > 100 && errors.length === 0) {
    warnings.push(`Large file detected (${lines.length - 1} rows). Processing may take a few minutes.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// Investment amount validation
export const validateInvestmentAmount = (amount: string, minimum: number = 100): ValidationResult => {
  const errors: string[] = [];
  
  if (!amount || amount.trim() === '') {
    errors.push('Investment amount is required');
  } else {
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount)) {
      errors.push('Please enter a valid amount');
    } else if (numAmount < minimum) {
      errors.push(`Minimum investment amount is $${minimum.toLocaleString()}`);
    } else if (numAmount > 10000000) {
      errors.push('Maximum investment amount is $10,000,000');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Risk tolerance validation
export const validateRiskTolerance = (riskLevel: string): ValidationResult => {
  const errors: string[] = [];
  const validLevels = ['low', 'medium', 'high'];
  
  if (!riskLevel || riskLevel.trim() === '') {
    errors.push('Please select your risk tolerance');
  } else if (!validLevels.includes(riskLevel.toLowerCase())) {
    errors.push('Please select a valid risk tolerance level');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Investment goals validation
export const validateInvestmentGoals = (goals: string[]): ValidationResult => {
  const errors: string[] = [];
  
  if (!goals || goals.length === 0) {
    errors.push('Please select at least one investment goal');
  } else if (goals.length > 5) {
    errors.push('Please select no more than 5 investment goals');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Generic form validation
export const validateForm = (
  data: Record<string, any>, 
  rules: Record<string, FieldValidation>
): Record<string, ValidationResult> => {
  const results: Record<string, ValidationResult> = {};

  Object.keys(rules).forEach(field => {
    const value = data[field];
    const rule = rules[field];
    const errors: string[] = [];

    // Required validation
    if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      errors.push(`${field} is required`);
    }

    // Length validations
    if (value && typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        errors.push(`${field} must be at least ${rule.minLength} characters`);
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push(`${field} must be no more than ${rule.maxLength} characters`);
      }
    }

    // Pattern validation
    if (value && rule.pattern && !rule.pattern.test(value.toString())) {
      errors.push(`${field} format is invalid`);
    }

    // Custom validation
    if (value && rule.custom) {
      const customError = rule.custom(value);
      if (customError) {
        errors.push(customError);
      }
    }

    results[field] = {
      isValid: errors.length === 0,
      errors
    };
  });

  return results;
};

// Password strength meter
export const getPasswordStrength = (password: string): {
  strength: 'weak' | 'medium' | 'strong' | 'very-strong';
  score: number;
  feedback: string[];
} => {
  if (!password) {
    return { strength: 'weak', score: 0, feedback: ['Enter a password'] };
  }

  let score = 0;
  const feedback: string[] = [];

  // Length
  if (password.length >= 8) score += 1;
  else feedback.push('Use at least 8 characters');

  if (password.length >= 12) score += 1;
  else if (password.length >= 8) feedback.push('Longer passwords are more secure');

  // Character variety
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Add lowercase letters');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Add uppercase letters');

  if (/\d/.test(password)) score += 1;
  else feedback.push('Add numbers');

  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;
  else feedback.push('Add special characters');

  // Bonus points
  if (password.length >= 16) score += 1;
  if (/[a-z].*[A-Z]|[A-Z].*[a-z]/.test(password)) score += 1; // Mixed case
  if ((password.match(/\d/g) || []).length >= 2) score += 1; // Multiple numbers

  let strength: 'weak' | 'medium' | 'strong' | 'very-strong';
  if (score < 3) strength = 'weak';
  else if (score < 5) strength = 'medium';
  else if (score < 7) strength = 'strong';
  else strength = 'very-strong';

  return { strength, score, feedback };
};