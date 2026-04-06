/**
 * ECharts reads host size at init; percentage-based heights often resolve to 0 before layout,
 * which collapses the grid. Use explicit pixels from layout + fallbacks.
 */
export function getChartHostPixelSize(el: HTMLElement): { width: number; height: number } {
  const rect = el.getBoundingClientRect();
  let width = Math.round(rect.width);
  let height = Math.round(rect.height);

  const wrap = el.parentElement;
  if (wrap && (width < 2 || height < 2)) {
    const pr = wrap.getBoundingClientRect();
    width = Math.max(width, Math.round(pr.width));
    height = Math.max(height, Math.round(pr.height));
  }

  if (width < 2) width = 320;
  if (height < 2) height = 240;

  return { width, height };
}

export function scheduleEChartsResize(
  chart: { resize: (opts?: { width?: number; height?: number }) => void } | null,
  el: HTMLElement | null | undefined
): void {
  if (!chart || !el) return;
  const run = () => {
    const { width, height } = getChartHostPixelSize(el);
    chart.resize({ width, height });
  };
  run();
  requestAnimationFrame(() => {
    run();
    requestAnimationFrame(run);
  });
}
