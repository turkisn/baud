export const MAX_CANVAS_PIXELS = 1_150_000;
export const MAX_CANVAS_DENSITY = 1.5;

const positiveNumber = (value, fallback = 1) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
};

export function canvasRenderSize(cssWidth, cssHeight, devicePixelRatio = 1) {
  const width = positiveNumber(cssWidth);
  const height = positiveNumber(cssHeight);
  const requestedDensity = Math.min(positiveNumber(devicePixelRatio), MAX_CANVAS_DENSITY);
  const pixelBudgetDensity = Math.sqrt(MAX_CANVAS_PIXELS / (width * height));
  const density = Math.max(Number.EPSILON, Math.min(requestedDensity, pixelBudgetDensity));

  return {
    width: Math.max(1, Math.round(width * density)),
    height: Math.max(1, Math.round(height * density)),
    density,
  };
}
