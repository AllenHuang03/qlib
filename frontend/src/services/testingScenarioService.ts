export interface TestScenario {
  id: string;
  name: string;
  description: string;
  userTypes: string[];
  steps: TestStep[];
  expectedOutcomes: string[];
  category: 'onboarding' | 'trading' | 'portfolio' | 'compliance' | 'support';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  prerequisites?: string[];
}

export interface TestStep {
  stepNumber: number;
  action: string;
  expectedResult: string;
  navigation?: string;
  validationCriteria: string[];
}

export const TestingScenarios: Record<string, TestScenario> = {
  // ONBOARDING SCENARIOS
  newCustomerKYC: {
    id: 'new-customer-kyc',
    name: 'New Customer KYC Onboarding',
    description: 'Complete the full KYC verification process for a new retail customer',
    userTypes: ['retail_customer'],
    category: 'onboarding',
    difficulty: 'beginner',
    estimatedTime: '15-20 minutes',
    steps: [
      {
        stepNumber: 1,
        action: 'Login with new customer account (newcustomer@test.com)',
        expectedResult: 'Dashboard loads with KYC pending status',
        navigation: '/dashboard',
        validationCriteria: ['KYC status shows "not_started"', 'KYC wizard prompt is visible']
      },
      {
        stepNumber: 2,
        action: 'Click "Complete KYC Verification" button',
        expectedResult: 'KYC wizard opens with welcome step',
        navigation: '/kyc',
        validationCriteria: ['Welcome step displays', 'Progress indicator shows step 1/8']
      },
      {
        stepNumber: 3,
        action: 'Complete personal details step',
        expectedResult: 'Form validation works, next step unlocks',
        validationCriteria: ['All required fields validate', 'Can proceed to next step']
      },
      {
        stepNumber: 4,
        action: 'Complete phone verification step',
        expectedResult: 'Phone verification simulation works',
        validationCriteria: ['Phone number format validates', 'SMS simulation triggers']
      },
      {
        stepNumber: 5,
        action: 'Complete email verification step',
        expectedResult: 'Email verification simulation works',
        validationCriteria: ['Email verification link simulation', 'Status updates correctly']
      },
      {
        stepNumber: 6,
        action: 'Upload identity documents',
        expectedResult: 'Document upload interface works',
        validationCriteria: ['File upload validates', 'Document preview displays']
      },
      {
        stepNumber: 7,
        action: 'Complete facial recognition step',
        expectedResult: 'Facial recognition simulation completes',
        validationCriteria: ['Camera interface loads', 'Simulation completes successfully']
      },
      {
        stepNumber: 8,
        action: 'Set up funding source',
        expectedResult: 'Bank account linking interface works',
        validationCriteria: ['Funding options display', 'Account linking form validates']
      },
      {
        stepNumber: 9,
        action: 'Complete KYC wizard',
        expectedResult: 'KYC status updates to pending review',
        navigation: '/dashboard',
        validationCriteria: ['KYC status shows "pending"', 'Success message displays']
      }
    ],
    expectedOutcomes: [
      'Customer successfully completes KYC process',
      'All form validations work correctly',
      'Document upload functionality operates properly',
      'Status tracking updates accurately throughout process'
    ]
  },

  premiumCustomerJourney: {
    id: 'premium-customer-journey',
    name: 'Premium Customer Experience',
    description: 'Test advanced features and tools available to premium customers',
    userTypes: ['premium_customer'],
    category: 'trading',
    difficulty: 'advanced',
    estimatedTime: '25-30 minutes',
    prerequisites: ['Approved KYC status', 'Premium subscription'],
    steps: [
      {
        stepNumber: 1,
        action: 'Login with premium customer account (premium@test.com)',
        expectedResult: 'Premium dashboard loads with advanced features',
        navigation: '/dashboard',
        validationCriteria: ['Premium dashboard layout', 'Advanced analytics visible', 'Premium badge displayed']
      },
      {
        stepNumber: 2,
        action: 'Access AI Insights Pro',
        expectedResult: 'Advanced AI insights interface loads',
        navigation: '/insights',
        validationCriteria: ['Premium AI features visible', 'Custom model options available', 'Advanced charts display']
      },
      {
        stepNumber: 3,
        action: 'Create custom AI model',
        expectedResult: 'Model creation wizard works',
        validationCriteria: ['Model parameters adjustable', 'Backtesting options available', 'Model saves successfully']
      },
      {
        stepNumber: 4,
        action: 'Access live trading environment',
        expectedResult: 'Real-time trading interface loads',
        navigation: '/trading-environment',
        validationCriteria: ['Live market data displays', 'Advanced order types available', 'Risk management tools visible']
      },
      {
        stepNumber: 5,
        action: 'Execute a complex trade',
        expectedResult: 'Advanced order execution works',
        validationCriteria: ['Order validation', 'Risk checks pass', 'Execution confirmation']
      }
    ],
    expectedOutcomes: [
      'Premium features function correctly',
      'Advanced trading tools operate properly',
      'Custom AI model creation works',
      'Live trading simulation executes successfully'
    ]
  },

  // STAFF SCENARIOS
  kycReviewProcess: {
    id: 'kyc-review-process',
    name: 'KYC Staff Review Workflow',
    description: 'Review and process customer KYC applications as compliance staff',
    userTypes: ['kyc_staff'],
    category: 'compliance',
    difficulty: 'intermediate',
    estimatedTime: '20-25 minutes',
    steps: [
      {
        stepNumber: 1,
        action: 'Login with KYC staff account (kyc.staff@test.com)',
        expectedResult: 'KYC dashboard loads with pending reviews',
        navigation: '/dashboard',
        validationCriteria: ['Pending KYC queue visible', 'Review metrics display', 'Staff tools available']
      },
      {
        stepNumber: 2,
        action: 'Select customer application for review',
        expectedResult: 'Customer details and documents load',
        navigation: '/admin',
        validationCriteria: ['Customer profile displays', 'Documents are viewable', 'Review form available']
      },
      {
        stepNumber: 3,
        action: 'Review identity documents',
        expectedResult: 'Document viewer works with zoom/annotations',
        validationCriteria: ['Document quality assessment', 'Fraud detection tools', 'Annotation capabilities']
      },
      {
        stepNumber: 4,
        action: 'Perform risk assessment',
        expectedResult: 'Risk scoring tools function',
        validationCriteria: ['Risk factors evaluated', 'Scoring algorithm works', 'Recommendations generated']
      },
      {
        stepNumber: 5,
        action: 'Complete review decision',
        expectedResult: 'Approval/rejection process works',
        validationCriteria: ['Decision rationale required', 'Customer notification sent', 'Status updates']
      }
    ],
    expectedOutcomes: [
      'KYC review workflow operates smoothly',
      'Document review tools function properly',
      'Risk assessment calculations work',
      'Decision process completes successfully'
    ]
  },

  // ADMIN SCENARIOS
  systemHealthMonitoring: {
    id: 'system-health-monitoring',
    name: 'IT Admin System Monitoring',
    description: 'Monitor system health, manage users, and handle security alerts',
    userTypes: ['admin'],
    category: 'support',
    difficulty: 'advanced',
    estimatedTime: '30-35 minutes',
    steps: [
      {
        stepNumber: 1,
        action: 'Login with admin account (admin@test.com)',
        expectedResult: 'Admin dashboard loads with system metrics',
        navigation: '/dashboard',
        validationCriteria: ['System health metrics', 'User activity overview', 'Security alerts panel']
      },
      {
        stepNumber: 2,
        action: 'Review system performance metrics',
        expectedResult: 'Real-time monitoring data displays',
        validationCriteria: ['CPU/Memory usage', 'Database performance', 'API response times']
      },
      {
        stepNumber: 3,
        action: 'Manage user accounts',
        expectedResult: 'User management interface works',
        navigation: '/admin',
        validationCriteria: ['User search/filter', 'Account status controls', 'Permission management']
      },
      {
        stepNumber: 4,
        action: 'Handle security alert',
        expectedResult: 'Security incident workflow functions',
        validationCriteria: ['Alert details display', 'Response actions available', 'Incident tracking']
      },
      {
        stepNumber: 5,
        action: 'Generate compliance report',
        expectedResult: 'Report generation completes',
        validationCriteria: ['Report parameters', 'Data accuracy', 'Export functionality']
      }
    ],
    expectedOutcomes: [
      'System monitoring tools function correctly',
      'User management capabilities work',
      'Security alert handling operates properly',
      'Reporting functionality generates accurate data'
    ]
  },

  // TRADING SCENARIOS
  institutionalTrading: {
    id: 'institutional-trading',
    name: 'Institutional Multi-Asset Trading',
    description: 'Execute complex multi-asset trades with institutional risk controls',
    userTypes: ['institutional'],
    category: 'trading',
    difficulty: 'advanced',
    estimatedTime: '40-45 minutes',
    prerequisites: ['Institutional approval', 'Risk management setup'],
    steps: [
      {
        stepNumber: 1,
        action: 'Login with institutional account (institution@test.com)',
        expectedResult: 'Institutional trading center loads',
        navigation: '/dashboard',
        validationCriteria: ['Multi-asset view', 'Risk dashboards', 'Compliance monitors']
      },
      {
        stepNumber: 2,
        action: 'Review portfolio risk metrics',
        expectedResult: 'Risk analysis tools display accurately',
        navigation: '/portfolio',
        validationCriteria: ['VaR calculations', 'Sector exposures', 'Correlation matrices']
      },
      {
        stepNumber: 3,
        action: 'Execute large block trade',
        expectedResult: 'Institutional order management works',
        navigation: '/trading-environment',
        validationCriteria: ['Block order handling', 'Market impact analysis', 'Execution algorithms']
      },
      {
        stepNumber: 4,
        action: 'Generate compliance report',
        expectedResult: 'Regulatory reporting functions',
        validationCriteria: ['Trade reporting', 'Position limits', 'Regulatory compliance']
      }
    ],
    expectedOutcomes: [
      'Institutional trading features work correctly',
      'Risk management tools function properly',
      'Compliance reporting operates accurately',
      'Large order execution handles appropriately'
    ]
  }
};

export class TestingScenarioService {
  static getAllScenarios(): TestScenario[] {
    return Object.values(TestingScenarios);
  }

  static getScenariosByUserType(userType: string): TestScenario[] {
    return Object.values(TestingScenarios).filter(scenario => 
      scenario.userTypes.includes(userType)
    );
  }

  static getScenariosByCategory(category: string): TestScenario[] {
    return Object.values(TestingScenarios).filter(scenario => 
      scenario.category === category
    );
  }

  static getScenariosByDifficulty(difficulty: string): TestScenario[] {
    return Object.values(TestingScenarios).filter(scenario => 
      scenario.difficulty === difficulty
    );
  }

  static getScenarioById(id: string): TestScenario | undefined {
    return TestingScenarios[id];
  }

  static executeScenario(scenarioId: string, userId: string): TestScenarioExecution {
    const scenario = this.getScenarioById(scenarioId);
    if (!scenario) {
      throw new Error(`Scenario ${scenarioId} not found`);
    }

    return {
      id: `exec-${Date.now()}`,
      scenarioId,
      userId,
      startTime: new Date(),
      status: 'in_progress',
      currentStep: 1,
      completedSteps: [],
      results: []
    };
  }

  static validateStep(
    execution: TestScenarioExecution, 
    stepNumber: number, 
    validationResults: StepValidationResult[]
  ): boolean {
    const scenario = this.getScenarioById(execution.scenarioId);
    if (!scenario) return false;

    const step = scenario.steps.find(s => s.stepNumber === stepNumber);
    if (!step) return false;

    const allPassed = validationResults.every(result => result.passed);
    
    if (allPassed) {
      execution.completedSteps.push(stepNumber);
      execution.currentStep = stepNumber + 1;
      
      if (execution.currentStep > scenario.steps.length) {
        execution.status = 'completed';
        execution.endTime = new Date();
      }
    }

    execution.results.push({
      stepNumber,
      validationResults,
      timestamp: new Date(),
      passed: allPassed
    });

    return allPassed;
  }

  static generateReport(execution: TestScenarioExecution): TestScenarioReport {
    const scenario = this.getScenarioById(execution.scenarioId);
    if (!scenario) {
      throw new Error(`Scenario ${execution.scenarioId} not found`);
    }

    const totalSteps = scenario.steps.length;
    const completedSteps = execution.completedSteps.length;
    const successRate = (completedSteps / totalSteps) * 100;

    return {
      execution,
      scenario,
      summary: {
        totalSteps,
        completedSteps,
        successRate,
        executionTime: execution.endTime 
          ? execution.endTime.getTime() - execution.startTime.getTime()
          : Date.now() - execution.startTime.getTime()
      },
      failedSteps: execution.results.filter(r => !r.passed),
      recommendations: this.generateRecommendations(execution, scenario)
    };
  }

  private static generateRecommendations(
    execution: TestScenarioExecution, 
    scenario: TestScenario
  ): string[] {
    const recommendations: string[] = [];
    const failedSteps = execution.results.filter(r => !r.passed);

    if (failedSteps.length === 0) {
      recommendations.push('Excellent! All test steps passed successfully.');
      recommendations.push('Consider running more advanced scenarios for this user type.');
    } else {
      recommendations.push(`${failedSteps.length} step(s) failed. Review the validation criteria.`);
      
      failedSteps.forEach(failed => {
        const step = scenario.steps.find(s => s.stepNumber === failed.stepNumber);
        if (step) {
          recommendations.push(`Step ${failed.stepNumber}: ${step.action} - Review implementation`);
        }
      });
    }

    return recommendations;
  }
}

export interface TestScenarioExecution {
  id: string;
  scenarioId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  status: 'in_progress' | 'completed' | 'failed';
  currentStep: number;
  completedSteps: number[];
  results: TestStepResult[];
}

export interface TestStepResult {
  stepNumber: number;
  validationResults: StepValidationResult[];
  timestamp: Date;
  passed: boolean;
}

export interface StepValidationResult {
  criteria: string;
  passed: boolean;
  notes?: string;
}

export interface TestScenarioReport {
  execution: TestScenarioExecution;
  scenario: TestScenario;
  summary: {
    totalSteps: number;
    completedSteps: number;
    successRate: number;
    executionTime: number;
  };
  failedSteps: TestStepResult[];
  recommendations: string[];
}