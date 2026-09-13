'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Box, Slide, Stack } from '@mui/material';
import { Alert, type AlertSeverity, type AlertVariant } from '@dhriti/ui/mui';

export interface GlobalAlertOptions {
  title: ReactNode;
  description?: ReactNode;
  severity?: AlertSeverity;
  variant?: AlertVariant;
  action?: ReactNode;
  dismissible?: boolean;
  duration?: number;
}

interface GlobalAlert extends Required<Pick<GlobalAlertOptions, 'severity' | 'variant' | 'dismissible'>>,
  Omit<GlobalAlertOptions, 'severity' | 'variant' | 'dismissible'> {
  id: number;
  open: boolean;
}

interface AlertContextValue {
  showAlert: (options: GlobalAlertOptions) => void;
  dismissAlert: (id: number) => void;
}

const DEFAULT_DURATION = 3_000;
const AlertContext = createContext<AlertContextValue | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<GlobalAlert[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, number>());
  const animationFrames = useRef(new Map<number, number>());

  const dismissAlert = useCallback((id: number) => {
    const animationFrame = animationFrames.current.get(id);
    if (animationFrame) {
      window.cancelAnimationFrame(animationFrame);
      animationFrames.current.delete(id);
    }
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
    setAlerts((currentAlerts) => currentAlerts.map((alert) => (
      alert.id === id ? { ...alert, open: false } : alert
    )));
  }, []);

  const removeAlert = useCallback((id: number) => {
    animationFrames.current.delete(id);
    timers.current.delete(id);
    setAlerts((currentAlerts) => currentAlerts.filter((alert) => alert.id !== id));
  }, []);

  const showAlert = useCallback((options: GlobalAlertOptions) => {
    const id = nextId.current++;
    const alert: GlobalAlert = {
      ...options,
      id,
      open: false,
      severity: options.severity ?? 'info',
      variant: options.variant ?? 'filled',
      dismissible: options.dismissible ?? true,
    };
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current.clear();
    animationFrames.current.forEach((animationFrame) => window.cancelAnimationFrame(animationFrame));
    animationFrames.current.clear();
    setAlerts([alert]);
    animationFrames.current.set(id, window.requestAnimationFrame(() => {
      animationFrames.current.delete(id);
      setAlerts((currentAlerts) => currentAlerts.map((currentAlert) => (
        currentAlert.id === id ? { ...currentAlert, open: true } : currentAlert
      )));
    }));

    const duration = options.duration ?? DEFAULT_DURATION;
    if (duration > 0) {
      timers.current.set(id, window.setTimeout(() => dismissAlert(id), duration));
    }
  }, [dismissAlert]);

  useEffect(() => () => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current.clear();
    animationFrames.current.forEach((animationFrame) => window.cancelAnimationFrame(animationFrame));
    animationFrames.current.clear();
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert, dismissAlert }}>
      {children}
      <Box
        aria-live="polite"
        sx={{
          left: '50%',
          maxWidth: 'calc(100% - 32px)',
          position: 'fixed',
          top: 16,
          transform: 'translateX(-50%)',
          width: 560,
          zIndex: (theme) => theme.zIndex.snackbar,
        }}
      >
        <Stack spacing={1}>
          {alerts.map((alert) => (
            <Slide
              key={alert.id}
              direction="down"
              in={alert.open}
              mountOnEnter
              unmountOnExit
              onExited={() => removeAlert(alert.id)}
            >
              <Alert
              key={alert.id}
              action={alert.action}
              description={alert.description}
              // dismissible={alert.dismissible}
              // onDismiss={() => dismissAlert(alert.id)}
              severity={alert.severity}
              variant={alert.variant}
              sx={{ fontWeight: "normal" }}
            >
              {alert.title}
              </Alert>
            </Slide>
          ))}
        </Stack>
      </Box>
    </AlertContext.Provider>
  );
}

export function useAlert(): AlertContextValue {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider.');
  }
  return context;
}