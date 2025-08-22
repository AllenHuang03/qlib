import React, { ReactNode, Suspense } from "react";
import { Box, CircularProgress, Typography, Container } from "@mui/material";

// SafeWrapper Component
interface SafeWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const SafeWrapper: React.FC<SafeWrapperProps> = ({
  children,
  fallback,
}) => {
  const defaultFallback = (
    <Container maxWidth="md" sx={{ mt: 8, textAlign: "center" }}>
      <Box sx={{ p: 4 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading...
        </Typography>
      </Box>
    </Container>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      <div className="safe-wrapper">{children}</div>
    </Suspense>
  );
};

// LoadingWrapper Component
interface LoadingWrapperProps {
  children: ReactNode;
  loading: boolean;
  loadingText?: string;
  error?: string | null;
  minHeight?: string | number;
}

export const LoadingWrapper: React.FC<LoadingWrapperProps> = ({
  children,
  loading,
  loadingText = "Loading...",
  error,
  minHeight = "400px",
}) => {
  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: "center" }}>
        <Box
          sx={{
            p: 4,
            minHeight,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Typography variant="h6" color="error" gutterBottom>
            Error
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {error}
          </Typography>
        </Box>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: "center" }}>
        <Box
          sx={{
            p: 4,
            minHeight,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            {loadingText}
          </Typography>
        </Box>
      </Container>
    );
  }

  return <>{children}</>;
};

// Additional utility functions for safeguards
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  return (props: P) => {
    try {
      return <Component {...props} />;
    } catch (error) {
      console.error("Component error:", error);
      return (
        <Box sx={{ p: 2, textAlign: "center" }}>
          <Typography variant="body2" color="error">
            Component failed to load
          </Typography>
        </Box>
      );
    }
  };
};

// Safe render utility
export const safeRender = (
  component: () => ReactNode,
  fallback?: ReactNode
): ReactNode => {
  try {
    return component();
  } catch (error) {
    console.error("Safe render error:", error);
    return (
      fallback || (
        <Box sx={{ p: 2, textAlign: "center" }}>
          <Typography variant="body2" color="error">
            Failed to render component
          </Typography>
        </Box>
      )
    );
  }
};

// Platform detection utility
export const getPlatformInfo = () => {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;

  return {
    isMobile:
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        userAgent
      ),
    isIOS: /iPad|iPhone|iPod/.test(userAgent),
    isAndroid: /Android/i.test(userAgent),
    isSafari: /^((?!chrome|android).)*safari/i.test(userAgent),
    isChrome: /Chrome/i.test(userAgent),
    isFirefox: /Firefox/i.test(userAgent),
    platform: platform,
  };
};

// Memory usage monitor (for development)
export const monitorMemory = () => {
  if (process.env.NODE_ENV === "development" && "memory" in performance) {
    const memory = (performance as any).memory;
    console.log("Memory usage:", {
      used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)} MB`,
      total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)} MB`,
      limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)} MB`,
    });
  }
};

// Default export
export default {
  SafeWrapper,
  LoadingWrapper,
  withErrorBoundary,
  safeRender,
  getPlatformInfo,
  monitorMemory,
};
