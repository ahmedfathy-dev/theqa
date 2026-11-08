// Shared motion presets. Curves match --ease-out in styles.css.
export const EASE_OUT = [0.23, 1, 0.32, 1];

// Layout/toggle motion: critically damped, no bounce, retargets when interrupted.
export const SPRING = { type: 'spring', duration: 0.35, bounce: 0 };

// One reveal per route: the page container staggers its cards in.
export const reveal = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.02 } },
};
export const rise = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE_OUT } },
};

// Small icon / state swap (copy -> copied, badge count, etc.)
export const swap = {
  initial: { opacity: 0, scale: 0.25, filter: 'blur(4px)' },
  animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.25, filter: 'blur(4px)' },
  transition: { type: 'spring', duration: 0.3, bounce: 0 },
};
