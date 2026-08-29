export const transitions = {
  duration: {
    shortest: 120,
    shorter: 160,
    short: 200,
    standard: 240,
    complex: 320,
    enteringScreen: 220,
    leavingScreen: 180,
  },
  easing: {
    easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    easeOut: "cubic-bezier(0, 0, 0.2, 1)",
    easeIn: "cubic-bezier(0.4, 0, 1, 1)",
    sharp: "cubic-bezier(0.4, 0, 0.6, 1)",
  },
} as const;
