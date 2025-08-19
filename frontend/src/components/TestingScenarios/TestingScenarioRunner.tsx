import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  CheckCircle,
  Error,
  ExpandMore,
  Schedule,
  Person,
  Assessment,
} from '@mui/icons-material';
import { useAuthStore } from '../../store/authStore';
import {
  TestingScenarioService,
  TestScenario,
  TestScenarioExecution,
  StepValidationResult,
} from '../../services/testingScenarioService';

export default function TestingScenarioRunner() {
  const { user, isTestAccount } = useAuthStore();
  const [scenarios, setScenarios] = useState<TestScenario[]>([]);
  const [currentExecution, setCurrentExecution] = useState<TestScenarioExecution | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<TestScenario | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  useEffect(() => {
    if (user?.userType) {
      const userScenarios = TestingScenarioService.getScenariosByUserType(user.userType);
      setScenarios(userScenarios);
    }
  }, [user]);

  const handleStartScenario = (scenario: TestScenario) => {
    if (!user) return;
    
    const execution = TestingScenarioService.executeScenario(scenario.id, user.id);
    setCurrentExecution(execution);
    setSelectedScenario(scenario);
  };

  const handleStopScenario = () => {
    setCurrentExecution(null);
    setSelectedScenario(null);
  };

  const handleViewDetails = (scenario: TestScenario) => {
    setSelectedScenario(scenario);
    setDetailsDialogOpen(true);
  };

  const simulateStepValidation = (stepNumber: number): StepValidationResult[] => {
    const scenario = selectedScenario;
    if (!scenario) return [];

    const step = scenario.steps.find(s => s.stepNumber === stepNumber);
    if (!step) return [];

    // Simulate validation results (in a real implementation, this would check actual UI state)
    return step.validationCriteria.map(criteria => ({
      criteria,
      passed: Math.random() > 0.2, // 80% success rate for simulation
      notes: Math.random() > 0.5 ? 'Validation passed successfully' : undefined
    }));
  };

  const handleCompleteStep = (stepNumber: number) => {
    if (!currentExecution || !selectedScenario) return;

    const validationResults = simulateStepValidation(stepNumber);
    const success = TestingScenarioService.validateStep(currentExecution, stepNumber, validationResults);

    // Update the execution state
    setCurrentExecution({ ...currentExecution });

    if (!success) {
      alert(`Step ${stepNumber} validation failed. Please review the criteria and try again.`);
    } else if (currentExecution.status === 'completed') {
      const report = TestingScenarioService.generateReport(currentExecution);
      alert(`Scenario completed! Success rate: ${report.summary.successRate.toFixed(1)}%`);
      handleStopScenario();
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'onboarding': return 'primary';
      case 'trading': return 'success';
      case 'portfolio': return 'info';
      case 'compliance': return 'warning';
      case 'support': return 'error';
      default: return 'default';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'error';
      default: return 'default';
    }
  };

  if (!isTestAccount) {
    return (
      <Alert severity="info">
        Testing scenarios are only available when logged in with test accounts. 
        Please login with a test account to access this feature.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Testing Scenario Runner
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Run comprehensive testing scenarios designed for your user type ({user?.userType?.replace('_', ' ')}). 
        Each scenario provides step-by-step guidance to test specific platform functionality.
      </Typography>

      {currentExecution && selectedScenario ? (
        // Active Scenario Execution
        <Card sx={{ mb: 4, border: 2, borderColor: 'primary.main' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" fontWeight="bold">
                Running: {selectedScenario.name}
              </Typography>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Stop />}
                onClick={handleStopScenario}
              >
                Stop Scenario
              </Button>
            </Box>

            <LinearProgress 
              variant="determinate" 
              value={(currentExecution.completedSteps.length / selectedScenario.steps.length) * 100}
              sx={{ mb: 3 }}
            />

            <Typography variant="body2" color="text.secondary" gutterBottom>
              Progress: {currentExecution.completedSteps.length} of {selectedScenario.steps.length} steps completed
            </Typography>

            <Stepper activeStep={currentExecution.currentStep - 1} orientation="vertical">
              {selectedScenario.steps.map((step, index) => (
                <Step key={step.stepNumber}>
                  <StepLabel
                    StepIconComponent={() => 
                      currentExecution.completedSteps.includes(step.stepNumber) ? (
                        <CheckCircle color="success" />
                      ) : currentExecution.currentStep === step.stepNumber ? (
                        <PlayArrow color="primary" />
                      ) : (
                        <div style={{ 
                          width: 24, 
                          height: 24, 
                          borderRadius: '50%', 
                          border: '1px solid #ccc',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px'
                        }}>
                          {step.stepNumber}
                        </div>
                      )
                    }
                  >
                    Step {step.stepNumber}: {step.action}
                  </StepLabel>
                  <StepContent>
                    <Typography variant="body2" paragraph>
                      <strong>Expected Result:</strong> {step.expectedResult}
                    </Typography>
                    {step.navigation && (
                      <Typography variant="body2" paragraph>
                        <strong>Navigation:</strong> {step.navigation}
                      </Typography>
                    )}
                    <Typography variant="body2" paragraph>
                      <strong>Validation Criteria:</strong>
                    </Typography>
                    <List dense>
                      {step.validationCriteria.map((criteria, idx) => (
                        <ListItem key={idx}>
                          <ListItemIcon>
                            <CheckCircle fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={criteria} />
                        </ListItem>
                      ))}
                    </List>
                    {currentExecution.currentStep === step.stepNumber && (
                      <Button
                        variant="contained"
                        onClick={() => handleCompleteStep(step.stepNumber)}
                        sx={{ mt: 1 }}
                      >
                        Complete Step
                      </Button>
                    )}
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>
      ) : (
        // Scenario Selection
        <Grid container spacing={3}>
          {scenarios.map((scenario) => (
            <Grid item xs={12} md={6} lg={4} key={scenario.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {scenario.name}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {scenario.description}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Chip 
                      label={scenario.category} 
                      size="small" 
                      color={getCategoryColor(scenario.category)}
                    />
                    <Chip 
                      label={scenario.difficulty} 
                      size="small" 
                      color={getDifficultyColor(scenario.difficulty)}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Schedule fontSize="small" />
                    <Typography variant="body2">
                      {scenario.estimatedTime}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Assessment fontSize="small" />
                    <Typography variant="body2">
                      {scenario.steps.length} steps
                    </Typography>
                  </Box>

                  {scenario.prerequisites && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <Typography variant="caption">
                        <strong>Prerequisites:</strong> {scenario.prerequisites.join(', ')}
                      </Typography>
                    </Alert>
                  )}
                </CardContent>

                <Box sx={{ p: 2, pt: 0 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<PlayArrow />}
                    onClick={() => handleStartScenario(scenario)}
                    sx={{ mb: 1 }}
                  >
                    Start Scenario
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => handleViewDetails(scenario)}
                  >
                    View Details
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {scenarios.length === 0 && (
        <Alert severity="info">
          No testing scenarios available for your user type. Please contact support if this seems incorrect.
        </Alert>
      )}

      {/* Scenario Details Dialog */}
      <Dialog 
        open={detailsDialogOpen} 
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedScenario && (
          <>
            <DialogTitle>
              {selectedScenario.name}
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" paragraph>
                {selectedScenario.description}
              </Typography>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6">Scenario Steps ({selectedScenario.steps.length})</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {selectedScenario.steps.map((step) => (
                    <Box key={step.stepNumber} sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Step {step.stepNumber}: {step.action}
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Expected Result:</strong> {step.expectedResult}
                      </Typography>
                      {step.navigation && (
                        <Typography variant="body2" paragraph>
                          <strong>Navigation:</strong> {step.navigation}
                        </Typography>
                      )}
                      <Typography variant="body2">
                        <strong>Validation Criteria:</strong>
                      </Typography>
                      <List dense>
                        {step.validationCriteria.map((criteria, idx) => (
                          <ListItem key={idx}>
                            <ListItemIcon>
                              <CheckCircle fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={criteria} />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  ))}
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6">Expected Outcomes</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List>
                    {selectedScenario.expectedOutcomes.map((outcome, idx) => (
                      <ListItem key={idx}>
                        <ListItemIcon>
                          <CheckCircle color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={outcome} />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsDialogOpen(false)}>
                Close
              </Button>
              <Button 
                variant="contained" 
                startIcon={<PlayArrow />}
                onClick={() => {
                  setDetailsDialogOpen(false);
                  handleStartScenario(selectedScenario);
                }}
              >
                Start Scenario
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}