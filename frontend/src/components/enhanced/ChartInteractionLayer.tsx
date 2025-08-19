/**
 * Interactive Chart Layer
 * Professional-grade chart interactions: zoom, pan, crosshair, annotations
 */

import React, { useRef, useCallback, useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  ButtonGroup,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Slider,
  Switch,
  FormControlLabel,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Timeline,
  ZoomIn,
  ZoomOut,
  PanTool,
  Crosshairs,
  Add,
  Remove,
  Straighten,
  TrendingUp,
  TrendingDown,
  HorizontalRule,
  RadioButtonUnchecked,
  Create,
  ClearAll,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';

export interface ChartAnnotation {
  id: string;
  type: 'line' | 'rectangle' | 'circle' | 'arrow' | 'text' | 'fibonacci';
  startPoint: { x: number; y: number; time: number; price: number };
  endPoint?: { x: number; y: number; time: number; price: number };
  style: {
    color: string;
    width: number;
    opacity: number;
    dash?: number[];
  };
  text?: string;
  visible: boolean;
}

export interface InteractionMode {
  type: 'pan' | 'zoom' | 'crosshair' | 'draw_line' | 'draw_rectangle' | 'draw_circle' | 'measure';
  cursor: string;
}

interface ChartInteractionLayerProps {
  chartRef: React.RefObject<HTMLDivElement>;
  width: number;
  height: number;
  onAnnotationAdd?: (annotation: ChartAnnotation) => void;
  onAnnotationUpdate?: (annotation: ChartAnnotation) => void;
  onAnnotationDelete?: (annotationId: string) => void;
  onModeChange?: (mode: InteractionMode) => void;
  annotations?: ChartAnnotation[];
}

const ChartInteractionLayer: React.FC<ChartInteractionLayerProps> = ({
  chartRef,
  width,
  height,
  onAnnotationAdd,
  onAnnotationUpdate,
  onAnnotationDelete,
  onModeChange,
  annotations = [],
}) => {
  const theme = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentMode, setCurrentMode] = useState<InteractionMode>({ type: 'crosshair', cursor: 'crosshair' });
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] = useState<Partial<ChartAnnotation> | null>(null);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [annotationOpacity, setAnnotationOpacity] = useState(0.8);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [crosshairPosition, setCrosshairPosition] = useState<{ x: number; y: number } | null>(null);
  
  // Drawing state
  const [drawingStyle, setDrawingStyle] = useState({
    color: theme.palette.primary.main,
    width: 2,
    opacity: 0.8,
  });

  // Mouse interaction handlers
  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Convert pixel coordinates to chart time/price (would need chart API integration)
    const time = Date.now(); // Placeholder
    const price = 100; // Placeholder

    switch (currentMode.type) {
      case 'draw_line':
      case 'draw_rectangle':
      case 'draw_circle':
        setIsDrawing(true);
        setCurrentAnnotation({
          id: `annotation_${Date.now()}`,
          type: currentMode.type.replace('draw_', '') as any,
          startPoint: { x, y, time, price },
          style: { ...drawingStyle },
          visible: true,
        });
        break;

      case 'measure':
        // Start measurement
        setIsDrawing(true);
        setCurrentAnnotation({
          id: `measure_${Date.now()}`,
          type: 'line',
          startPoint: { x, y, time, price },
          style: {
            color: theme.palette.warning.main,
            width: 1,
            opacity: 0.8,
            dash: [5, 5],
          },
          visible: true,
        });
        break;
    }
  }, [currentMode, drawingStyle, theme]);

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Update crosshair position
    if (currentMode.type === 'crosshair') {
      setCrosshairPosition({ x, y });
    }

    // Update drawing annotation
    if (isDrawing && currentAnnotation) {
      const time = Date.now(); // Placeholder
      const price = 100; // Placeholder

      setCurrentAnnotation(prev => ({
        ...prev!,
        endPoint: { x, y, time, price },
      }));
    }
  }, [currentMode, isDrawing, currentAnnotation]);

  const handleMouseUp = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDrawing && currentAnnotation) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const time = Date.now(); // Placeholder
      const price = 100; // Placeholder

      const finalAnnotation: ChartAnnotation = {
        ...currentAnnotation as ChartAnnotation,
        endPoint: { x, y, time, price },
      };

      onAnnotationAdd?.(finalAnnotation);
      setIsDrawing(false);
      setCurrentAnnotation(null);
    }
  }, [isDrawing, currentAnnotation, onAnnotationAdd]);

  const handleMouseLeave = useCallback(() => {
    setCrosshairPosition(null);
  }, []);

  // Mode change handlers
  const handleModeChange = (newMode: InteractionMode) => {
    setCurrentMode(newMode);
    onModeChange?.(newMode);
    setMenuAnchorEl(null);
  };

  // Drawing tools menu
  const handleDrawingMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleDrawingMenuClose = () => {
    setMenuAnchorEl(null);
  };

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Set high DPI
    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    // Draw crosshair
    if (currentMode.type === 'crosshair' && crosshairPosition) {
      ctx.save();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = theme.palette.primary.main;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.7;

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(crosshairPosition.x, 0);
      ctx.lineTo(crosshairPosition.x, height);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(0, crosshairPosition.y);
      ctx.lineTo(width, crosshairPosition.y);
      ctx.stroke();

      ctx.restore();
    }

    // Draw annotations
    if (showAnnotations) {
      [...annotations, ...(currentAnnotation ? [currentAnnotation as ChartAnnotation] : [])].forEach(annotation => {
        if (!annotation.visible) return;

        ctx.save();
        ctx.strokeStyle = annotation.style.color;
        ctx.lineWidth = annotation.style.width;
        ctx.globalAlpha = annotation.style.opacity * annotationOpacity;

        if (annotation.style.dash) {
          ctx.setLineDash(annotation.style.dash);
        }

        switch (annotation.type) {
          case 'line':
            if (annotation.endPoint) {
              ctx.beginPath();
              ctx.moveTo(annotation.startPoint.x, annotation.startPoint.y);
              ctx.lineTo(annotation.endPoint.x, annotation.endPoint.y);
              ctx.stroke();

              // Draw measurement info for measure tool
              if (annotation.id.startsWith('measure_') && annotation.endPoint) {
                const distance = Math.sqrt(
                  Math.pow(annotation.endPoint.x - annotation.startPoint.x, 2) +
                  Math.pow(annotation.endPoint.y - annotation.startPoint.y, 2)
                );
                
                ctx.save();
                ctx.fillStyle = theme.palette.warning.main;
                ctx.font = '12px Roboto';
                ctx.fillText(
                  `${distance.toFixed(1)}px`,
                  (annotation.startPoint.x + annotation.endPoint.x) / 2,
                  (annotation.startPoint.y + annotation.endPoint.y) / 2 - 5
                );
                ctx.restore();
              }
            }
            break;

          case 'rectangle':
            if (annotation.endPoint) {
              const width = annotation.endPoint.x - annotation.startPoint.x;
              const height = annotation.endPoint.y - annotation.startPoint.y;
              ctx.strokeRect(annotation.startPoint.x, annotation.startPoint.y, width, height);
            }
            break;

          case 'circle':
            if (annotation.endPoint) {
              const radius = Math.sqrt(
                Math.pow(annotation.endPoint.x - annotation.startPoint.x, 2) +
                Math.pow(annotation.endPoint.y - annotation.startPoint.y, 2)
              );
              ctx.beginPath();
              ctx.arc(annotation.startPoint.x, annotation.startPoint.y, radius, 0, 2 * Math.PI);
              ctx.stroke();
            }
            break;
        }

        ctx.restore();
      });
    }
  }, [
    width,
    height,
    currentMode,
    crosshairPosition,
    annotations,
    currentAnnotation,
    showAnnotations,
    annotationOpacity,
    theme,
  ]);

  return (
    <Box sx={{ position: 'relative', width, height }}>
      {/* Interactive Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          cursor: currentMode.cursor,
          pointerEvents: 'all',
          zIndex: 2,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />

      {/* Toolbar */}
      <Paper
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          p: 1,
          backgroundColor: alpha(theme.palette.background.paper, 0.9),
          backdropFilter: 'blur(8px)',
          zIndex: 3,
        }}
      >
        <ButtonGroup orientation="vertical" variant="outlined" size="small">
          {/* Navigation Tools */}
          <Tooltip title="Pan" placement="left">
            <IconButton
              color={currentMode.type === 'pan' ? 'primary' : 'default'}
              onClick={() => handleModeChange({ type: 'pan', cursor: 'grab' })}
            >
              <PanTool />
            </IconButton>
          </Tooltip>

          <Tooltip title="Crosshair" placement="left">
            <IconButton
              color={currentMode.type === 'crosshair' ? 'primary' : 'default'}
              onClick={() => handleModeChange({ type: 'crosshair', cursor: 'crosshair' })}
            >
              <Crosshairs />
            </IconButton>
          </Tooltip>

          {/* Zoom Tools */}
          <Tooltip title="Zoom In" placement="left">
            <IconButton
              color={currentMode.type === 'zoom' ? 'primary' : 'default'}
              onClick={() => handleModeChange({ type: 'zoom', cursor: 'zoom-in' })}
            >
              <ZoomIn />
            </IconButton>
          </Tooltip>

          <Tooltip title="Zoom Out" placement="left">
            <IconButton onClick={() => {/* Implement zoom out */}}>
              <ZoomOut />
            </IconButton>
          </Tooltip>

          {/* Drawing Tools */}
          <Tooltip title="Drawing Tools" placement="left">
            <IconButton onClick={handleDrawingMenuOpen}>
              <Create />
            </IconButton>
          </Tooltip>

          <Tooltip title="Measure" placement="left">
            <IconButton
              color={currentMode.type === 'measure' ? 'primary' : 'default'}
              onClick={() => handleModeChange({ type: 'measure', cursor: 'crosshair' })}
            >
              <Straighten />
            </IconButton>
          </Tooltip>

          {/* Annotation Visibility */}
          <Tooltip title={showAnnotations ? "Hide Annotations" : "Show Annotations"} placement="left">
            <IconButton
              color={showAnnotations ? 'primary' : 'default'}
              onClick={() => setShowAnnotations(!showAnnotations)}
            >
              {showAnnotations ? <Visibility /> : <VisibilityOff />}
            </IconButton>
          </Tooltip>

          {/* Clear All */}
          <Tooltip title="Clear All Annotations" placement="left">
            <IconButton
              onClick={() => {
                annotations.forEach(annotation => onAnnotationDelete?.(annotation.id));
              }}
            >
              <ClearAll />
            </IconButton>
          </Tooltip>
        </ButtonGroup>

        {/* Opacity Slider */}
        {showAnnotations && (
          <Box sx={{ mt: 2, width: 120 }}>
            <Typography variant="caption" gutterBottom>
              Opacity
            </Typography>
            <Slider
              size="small"
              value={annotationOpacity}
              onChange={(_, value) => setAnnotationOpacity(value as number)}
              min={0.1}
              max={1}
              step={0.1}
              marks={[
                { value: 0.2, label: '20%' },
                { value: 0.5, label: '50%' },
                { value: 0.8, label: '80%' },
                { value: 1, label: '100%' },
              ]}
            />
          </Box>
        )}
      </Paper>

      {/* Drawing Tools Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleDrawingMenuClose}
        anchorOrigin={{ vertical: 'center', horizontal: 'left' }}
        transformOrigin={{ vertical: 'center', horizontal: 'right' }}
      >
        <MenuItem onClick={() => handleModeChange({ type: 'draw_line', cursor: 'crosshair' })}>
          <ListItemIcon>
            <Timeline fontSize="small" />
          </ListItemIcon>
          <ListItemText>Trend Line</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => handleModeChange({ type: 'draw_rectangle', cursor: 'crosshair' })}>
          <ListItemIcon>
            <HorizontalRule fontSize="small" />
          </ListItemIcon>
          <ListItemText>Rectangle</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => handleModeChange({ type: 'draw_circle', cursor: 'crosshair' })}>
          <ListItemIcon>
            <RadioButtonUnchecked fontSize="small" />
          </ListItemIcon>
          <ListItemText>Circle</ListItemText>
        </MenuItem>
      </Menu>

      {/* Price and Time Display */}
      {crosshairPosition && currentMode.type === 'crosshair' && (
        <Paper
          sx={{
            position: 'absolute',
            top: crosshairPosition.y + 10,
            left: crosshairPosition.x + 10,
            p: 1,
            backgroundColor: alpha(theme.palette.background.paper, 0.95),
            backdropFilter: 'blur(4px)',
            zIndex: 3,
            fontSize: '0.75rem',
          }}
        >
          <Typography variant="caption" display="block">
            Price: $110.50 {/* Placeholder - would calculate from chart position */}
          </Typography>
          <Typography variant="caption" display="block">
            Time: {new Date().toLocaleTimeString()}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default ChartInteractionLayer;