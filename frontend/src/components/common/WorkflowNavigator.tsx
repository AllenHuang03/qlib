/**
 * Workflow Navigator
 * Helps users navigate between platform features with smart recommendations
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  IconButton,
  Divider,
  Alert,
  useTheme,
  alpha
} from '@mui/material';
import {
  NavigateNext,
  PlayArrow,
  CheckCircle,
  ExpandMore,
  ExpandLess,
  Lightbulb,
  TrendingUp,
  School,
  Timeline,
  AutoGraph
} from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import { workflowOrchestrator, UserJourney, WorkflowStep } from '../../services/WorkflowOrchestrator';
import { navigationController } from '../../services/NavigationController';

interface WorkflowNavigatorProps {
  userId?: string;
  variant?: 'card' | 'inline' | 'sidebar';
  showRecommendations?: boolean;
  showJourneyProgress?: boolean;
}

const WorkflowNavigator: React.FC<WorkflowNavigatorProps> = ({
  userId = 'demo-user',
  variant = 'card',
  showRecommendations = true,
  showJourneyProgress = true
}) => {
  const theme = useTheme();
  const location = useLocation();
  const [currentJourney, setCurrentJourney] = useState<{
    journey: UserJourney;
    currentStep: WorkflowStep;
    progress: number;
  } | null>(null);
  const [nextRecommendation, setNextRecommendation] = useState<{
    suggestion: string;
    action: string;
    reasoning: string;
  } | null>(null);
  const [availableJourneys, setAvailableJourneys] = useState<UserJourney[]>([]);
  const [showJourneyDetails, setShowJourneyDetails] = useState(false);

  useEffect(() => {
    // Load current journey and recommendations
    const journey = workflowOrchestrator.getCurrentJourney(userId);
    const recommendation = workflowOrchestrator.getNextRecommendedAction(userId, location.pathname);
    const journeys = workflowOrchestrator.getRecommendedJourneys('retail_customer', 'beginner');

    setCurrentJourney(journey);
    setNextRecommendation(recommendation);
    setAvailableJourneys(journeys);
  }, [userId, location.pathname]);

  const handleStartJourney = (journeyId: string) => {
    const success = workflowOrchestrator.startJourney(userId, journeyId);
    if (success) {
      const journey = workflowOrchestrator.getCurrentJourney(userId);
      setCurrentJourney(journey);
    }
  };

  const handleCompleteStep = () => {
    const result = workflowOrchestrator.completeCurrentStep(userId);
    if (result.completed) {
      if (result.journeyComplete) {
        setCurrentJourney(null);
      } else {
        const journey = workflowOrchestrator.getCurrentJourney(userId);
        setCurrentJourney(journey);
      }
    }
  };

  const handleNavigateToStep = (step: WorkflowStep) => {
    workflowOrchestrator.navigateToStep(userId, step);
  };

  const handleRecommendationAction = () => {
    if (nextRecommendation) {
      navigationController.navigate(nextRecommendation.action);
    }
  };

  const getStepIcon = (step: WorkflowStep, isCompleted: boolean, isCurrent: boolean) => {
    if (isCompleted) return <CheckCircle color="success" />;
    if (isCurrent) return <PlayArrow color="primary" />;
    return <NavigateNext color="disabled" />;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'success';
      case 'Medium': return 'warning';
      case 'Advanced': return 'error';
      default: return 'default';
    }
  };

  const renderJourneyProgress = () => {
    if (!showJourneyProgress || !currentJourney) return null;

    const { journey, currentStep, progress } = currentJourney;

    return (
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Timeline color="primary" />
                {journey.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {journey.description}
              </Typography>
            </Box>
            <Chip label={`${Math.round(progress)}% Complete`} color="primary" variant="outlined" />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Current Step: {currentStep.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {journey.steps.findIndex(s => s.id === currentStep.id) + 1} of {journey.steps.length}
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ 
                height: 8, 
                borderRadius: 4,
                backgroundColor: alpha(theme.palette.primary.main, 0.1)
              }}
            />
          </Box>

          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Next: {currentStep.title}
            </Typography>
            <Typography variant="body2">
              {currentStep.description}
            </Typography>
            <Box sx={{ mt: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
              <Chip size="small" label={`⏱️ ${currentStep.estimatedTime}`} />
              <Chip size="small" label={currentStep.difficulty} color={getDifficultyColor(currentStep.difficulty) as any} />
            </Box>
          </Alert>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={() => handleNavigateToStep(currentStep)}
              startIcon={<PlayArrow />}
            >
              Start This Step
            </Button>
            <Button
              variant="outlined"
              onClick={handleCompleteStep}
              startIcon={<CheckCircle />}
            >
              Mark Complete
            </Button>
            <Button
              variant="text"
              onClick={() => setShowJourneyDetails(!showJourneyDetails)}
              endIcon={showJourneyDetails ? <ExpandLess /> : <ExpandMore />}
            >
              {showJourneyDetails ? 'Hide' : 'Show'} All Steps
            </Button>
          </Box>

          <Collapse in={showJourneyDetails}>
            <Box sx={{ mt: 2 }}>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Journey Overview
              </Typography>
              <List dense>
                {journey.steps.map((step, index) => {
                  const currentStepIndex = journey.steps.findIndex(s => s.id === currentStep.id);
                  const isCompleted = index < currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  
                  return (
                    <ListItem key={step.id} sx={{ pl: 0 }}>
                      <ListItemIcon>
                        {getStepIcon(step, isCompleted, isCurrent)}
                      </ListItemIcon>
                      <ListItemText
                        primary={step.title}
                        secondary={`${step.estimatedTime} • ${step.difficulty}`}
                        sx={{
                          opacity: isCompleted ? 0.7 : isCurrent ? 1 : 0.5
                        }}
                      />
                      {isCurrent && (
                        <Button
                          size="small"
                          onClick={() => handleNavigateToStep(step)}
                        >
                          Go
                        </Button>
                      )}
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    );
  };

  const renderRecommendations = () => {
    if (!showRecommendations) return null;

    return (
      <Card elevation={1} sx={{ mb: 3, backgroundColor: alpha(theme.palette.success.main, 0.05) }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Lightbulb color="success" />
            Smart Recommendations
          </Typography>

          {nextRecommendation ? (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  💡 {nextRecommendation.suggestion}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {nextRecommendation.reasoning}
                </Typography>
              </Alert>
              <Button
                variant="contained"
                color="success"
                onClick={handleRecommendationAction}
                startIcon={<TrendingUp />}
              >
                Take This Action
              </Button>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Continue exploring the platform to get personalized recommendations.
            </Typography>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderAvailableJourneys = () => {
    if (currentJourney || availableJourneys.length === 0) return null;

    return (
      <Card elevation={1}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <School color="primary" />
            Start Your Trading Journey
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Choose a guided journey to learn the platform systematically:
          </Typography>

          {availableJourneys.map((journey) => (
            <Card key={journey.id} variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {journey.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {journey.description}
                    </Typography>
                  </Box>
                  <Chip label={journey.totalTime} size="small" variant="outlined" />
                </Box>

                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip size="small" label={`${journey.steps.length} steps`} />
                  <Chip size="small" label={journey.outcome.split(' ').slice(0, 3).join(' ')} color="primary" variant="outlined" />
                </Box>

                <Button
                  variant="contained"
                  size="small"
                  onClick={() => handleStartJourney(journey.id)}
                  startIcon={<AutoGraph />}
                >
                  Start Journey
                </Button>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    );
  };

  if (variant === 'inline') {
    return (
      <Box sx={{ mb: 2 }}>
        {nextRecommendation && (
          <Alert severity="info" action={
            <Button size="small" onClick={handleRecommendationAction}>
              Go
            </Button>
          }>
            💡 {nextRecommendation.suggestion}
          </Alert>
        )}
      </Box>
    );
  }

  return (
    <Box>
      {renderJourneyProgress()}
      {renderRecommendations()}
      {renderAvailableJourneys()}
    </Box>
  );
};

export default WorkflowNavigator;