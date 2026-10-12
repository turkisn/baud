export function demoModeEnabled(environment, requested) {
  return ['staging', 'development', 'test'].includes(environment) && requested === 'true';
}
