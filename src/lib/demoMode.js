import { demoModeEnabled } from '../utils/demoMode';
export const DEMO_MODE = demoModeEnabled(import.meta.env.VITE_BUOD_ENV, import.meta.env.VITE_DEMO_MODE);
