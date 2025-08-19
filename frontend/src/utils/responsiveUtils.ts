import { useTheme, useMediaQuery } from '@mui/material';

// Custom hook for responsive breakpoints
export const useResponsive = () => {
  const theme = useTheme();
  
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    isSmallScreen
  };
};

// Responsive spacing utility
export const getResponsiveSpacing = (mobile: number, tablet?: number, desktop?: number) => {
  return {
    xs: mobile,
    md: tablet || mobile * 1.5,
    lg: desktop || tablet || mobile * 2
  };
};

// Responsive font sizes
export const getResponsiveFontSize = (base: number) => {
  return {
    fontSize: {
      xs: `${base * 0.8}rem`,
      sm: `${base * 0.9}rem`,
      md: `${base}rem`,
      lg: `${base * 1.1}rem`
    }
  };
};

// Grid breakpoints for different screen sizes
export const getResponsiveGrid = (mobile: number, tablet?: number, desktop?: number) => {
  return {
    xs: 12,
    sm: mobile,
    md: tablet || mobile,
    lg: desktop || tablet || mobile
  };
};

// Container max widths for different content types
export const getContainerMaxWidth = (contentType: 'form' | 'dashboard' | 'table' | 'full') => {
  switch (contentType) {
    case 'form':
      return { maxWidth: { xs: '100%', sm: 600, md: 800 } };
    case 'dashboard':
      return { maxWidth: { xs: '100%', lg: 1400 } };
    case 'table':
      return { maxWidth: '100%', overflow: 'auto' };
    case 'full':
    default:
      return { maxWidth: '100%' };
  }
};

// Responsive card padding
export const getCardPadding = (size: 'small' | 'medium' | 'large' = 'medium') => {
  const paddingMap = {
    small: { xs: 2, md: 3 },
    medium: { xs: 3, md: 4 },
    large: { xs: 4, md: 6 }
  };
  
  return { p: paddingMap[size] };
};

// Mobile-first button sizing
export const getButtonSize = (context: 'form' | 'action' | 'nav' = 'action') => {
  switch (context) {
    case 'form':
      return {
        size: { xs: 'large', md: 'medium' } as any,
        fullWidth: { xs: true, md: false }
      };
    case 'nav':
      return {
        size: { xs: 'small', md: 'medium' } as any
      };
    case 'action':
    default:
      return {
        size: { xs: 'medium', md: 'large' } as any
      };
  }
};

// Responsive table configuration
export const getTableConfig = () => {
  return {
    stickyHeader: true,
    sx: {
      '& .MuiTableCell-root': {
        padding: { xs: '8px', md: '16px' },
        fontSize: { xs: '0.8rem', md: '0.875rem' }
      },
      '& .MuiTableCell-head': {
        fontWeight: 'bold',
        backgroundColor: 'background.paper'
      }
    }
  };
};

// Responsive dialog/modal configuration
export const getDialogConfig = (size: 'small' | 'medium' | 'large' = 'medium') => {
  const maxWidthMap = {
    small: 'sm' as const,
    medium: 'md' as const,
    large: 'lg' as const
  };
  
  return {
    maxWidth: maxWidthMap[size],
    fullWidth: true,
    fullScreen: { xs: size === 'large', md: false }
  };
};

// Touch-friendly spacing for mobile
export const getTouchSpacing = () => {
  return {
    minHeight: { xs: 48, md: 40 }, // Minimum touch target size
    padding: { xs: '12px 16px', md: '8px 12px' },
    margin: { xs: '8px 0', md: '4px 0' }
  };
};

// Responsive navigation configuration
export const getNavConfig = () => {
  return {
    drawer: {
      width: { xs: '100%', md: 280 },
      variant: { xs: 'temporary' as const, md: 'permanent' as const }
    },
    appBar: {
      height: { xs: 64, md: 72 }
    }
  };
};

// Chart responsive configuration
export const getChartConfig = () => {
  return {
    height: { xs: 250, md: 300, lg: 400 },
    margin: { xs: 10, md: 20 }
  };
};

// Form layout helpers
export const getFormLayout = (fields: number) => {
  if (fields <= 2) {
    return { xs: 12, md: 6 };
  } else if (fields <= 4) {
    return { xs: 12, sm: 6, md: 4 };
  } else {
    return { xs: 12, sm: 6, md: 4, lg: 3 };
  }
};

// Stepper responsive configuration
export const getStepperConfig = () => {
  return {
    orientation: { xs: 'vertical' as const, md: 'horizontal' as const },
    alternativeLabel: { xs: false, md: true }
  };
};

// Tab configuration for mobile
export const getTabConfig = () => {
  return {
    variant: { xs: 'scrollable' as const, md: 'standard' as const },
    scrollButtons: { xs: 'auto' as const, md: false as const },
    allowScrollButtonsMobile: true
  };
};

// Responsive image configuration
export const getImageConfig = (aspectRatio: string = '16:9') => {
  const [width, height] = aspectRatio.split(':').map(Number);
  const ratio = height / width;
  
  return {
    width: '100%',
    height: 'auto',
    aspectRatio: ratio,
    objectFit: 'cover' as const,
    maxHeight: { xs: 200, md: 300, lg: 400 }
  };
};

// Responsive card grid
export const getCardGrid = (itemsPerRow: { mobile: number; tablet: number; desktop: number }) => {
  return {
    xs: 12 / itemsPerRow.mobile,
    md: 12 / itemsPerRow.tablet,
    lg: 12 / itemsPerRow.desktop
  };
};

// Utility to check if device is likely touch-enabled
export const isTouchDevice = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// Responsive animation configurations
export const getAnimationConfig = () => {
  return {
    // Reduce motion for mobile to save battery
    duration: { xs: 200, md: 300 },
    easing: 'ease-in-out',
    delay: { xs: 0, md: 100 }
  };
};

// Performance-optimized list configuration
export const getListConfig = (itemCount: number) => {
  return {
    dense: itemCount > 10,
    disablePadding: itemCount > 20,
    virtualization: itemCount > 100
  };
};

// Responsive toolbar configuration
export const getToolbarConfig = () => {
  return {
    minHeight: { xs: 56, md: 64 },
    padding: { xs: '0 16px', md: '0 24px' },
    flexDirection: { xs: 'column' as const, md: 'row' as const },
    gap: { xs: 1, md: 2 }
  };
};