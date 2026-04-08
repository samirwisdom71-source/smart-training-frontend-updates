import type { EChartsOption } from 'echarts';
import * as echarts from 'echarts';

/** Matches Google font + theme stack (see _variables.scss) */
export const DASHBOARD_CHART_FONT = 'Cairo, "Segoe UI", system-ui, sans-serif';

export const CHART_COLORS = {
  primary: '#0f766e',
  accent: '#c4a047',
  success: '#059669',
  info: '#0284c7',
  coral: '#ea580c',
  /** Axis tick / category labels — strong contrast on white cards */
  axisLabel: '#475569',
  /** Legend & secondary labels */
  legendText: '#334155',
  /** @deprecated use axisLabel — kept for quick refactors */
  muted: '#64748b',
  /** Horizontal value grid */
  grid: 'rgba(148, 163, 184, 0.35)'
};

export const PALETTE = [
  CHART_COLORS.primary,
  CHART_COLORS.accent,
  CHART_COLORS.success,
  CHART_COLORS.info,
  CHART_COLORS.coral,
  '#7c3aed',
  '#64748b'
];

/** Shared animation — presentation only; does not affect data */
const chartAnimation = (): Pick<EChartsOption, 'animationDuration' | 'animationDurationUpdate' | 'animationEasing'> => ({
  animationDuration: 780,
  animationDurationUpdate: 360,
  animationEasing: 'cubicOut'
});

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '').slice(0, 6);
  if (h.length !== 6) return `rgba(10,77,82,${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function text(fontSize: number, color: string) {
  return {
    fontFamily: DASHBOARD_CHART_FONT,
    fontSize,
    color,
    fontWeight: 400 as const
  };
}

const tooltipAxis = (): EChartsOption['tooltip'] => ({
  trigger: 'axis',
  backgroundColor: 'rgba(15, 23, 42, 0.94)',
  borderColor: 'rgba(148, 163, 184, 0.22)',
  borderWidth: 1,
  padding: [12, 14],
  extraCssText: 'border-radius: 12px; box-shadow: 0 18px 44px rgba(15, 23, 42, 0.18);',
  textStyle: {
    fontFamily: DASHBOARD_CHART_FONT,
    fontSize: 13,
    color: '#f8fafc'
  }
});

const tooltipItem = (): EChartsOption['tooltip'] => ({
  trigger: 'item',
  backgroundColor: 'rgba(15, 23, 42, 0.94)',
  borderColor: 'rgba(148, 163, 184, 0.22)',
  borderWidth: 1,
  padding: [12, 14],
  extraCssText: 'border-radius: 12px; box-shadow: 0 18px 44px rgba(15, 23, 42, 0.18);',
  textStyle: {
    fontFamily: DASHBOARD_CHART_FONT,
    fontSize: 13,
    color: '#f8fafc'
  }
});

const gridStandard = (): EChartsOption['grid'] => ({
  left: '2%',
  right: '3%',
  bottom: '4%',
  top: '10%',
  containLabel: true
});

/**
 * Dashboard cards: fixed margins (containLabel off) so RTL page dir does not confuse measure.
 * Arabic category text still renders correctly; only layout direction is LTR inside the chart box.
 */
const gridCompactCartesian = (): EChartsOption['grid'] => ({
  left: 52,
  right: 18,
  top: 36,
  bottom: 88,
  containLabel: false
});

const gridCompactHorizontal = (): EChartsOption['grid'] => ({
  left: 168,
  right: 20,
  top: 16,
  bottom: 28,
  containLabel: false
});

export function buildLineOption(
  labels: string[],
  values: number[],
  color: string
): EChartsOption {
  return {
    textStyle: {
      fontFamily: DASHBOARD_CHART_FONT,
      color: CHART_COLORS.legendText
    },
    ...chartAnimation(),
    grid: gridCompactCartesian(),
    tooltip: {
      ...tooltipAxis(),
      axisPointer: {
        type: 'line',
        lineStyle: {
          color: hexToRgba(color, 0.35),
          width: 2,
          type: 'dashed'
        }
      }
    },
    xAxis: {
      type: 'category',
      position: 'bottom',
      boundaryGap: false,
      data: labels,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { ...text(12, CHART_COLORS.axisLabel) }
    },
    yAxis: {
      type: 'value',
      position: 'left',
      splitLine: {
        lineStyle: { color: CHART_COLORS.grid, type: 'dashed', width: 1 }
      },
      axisLabel: { ...text(11, CHART_COLORS.axisLabel) }
    },
    series: [
      {
        type: 'line',
        data: values,
        smooth: true,
        smoothMonotone: 'x',
        symbol: 'circle',
        symbolSize: 7,
        showSymbol: true,
        lineStyle: { color, width: 2.5, shadowBlur: 10, shadowColor: hexToRgba(color, 0.25), shadowOffsetY: 4 },
        itemStyle: {
          color: '#ffffff',
          borderColor: color,
          borderWidth: 2
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: hexToRgba(color, 0.2) },
            { offset: 1, color: hexToRgba(color, 0.03) }
          ])
        }
      }
    ]
  };
}

export function buildBarVerticalOption(
  labels: string[],
  values: number[],
  color: string
): EChartsOption {
  return {
    textStyle: {
      fontFamily: DASHBOARD_CHART_FONT,
      color: CHART_COLORS.legendText
    },
    ...chartAnimation(),
    grid: gridCompactCartesian(),
    tooltip: {
      ...tooltipAxis(),
      axisPointer: {
        type: 'shadow',
        shadowStyle: { color: 'rgba(15, 23, 42, 0.06)' }
      }
    },
    xAxis: {
      type: 'category',
      position: 'bottom',
      data: labels,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        ...text(12, CHART_COLORS.axisLabel),
        rotate: 40,
        interval: 0,
        hideOverlap: false
      }
    },
    yAxis: {
      type: 'value',
      position: 'left',
      splitLine: {
        lineStyle: { color: CHART_COLORS.grid, type: 'dashed', width: 1 }
      },
      axisLabel: { ...text(11, CHART_COLORS.axisLabel) }
    },
    series: [
      {
        type: 'bar',
        data: values,
        barMaxWidth: 48,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: hexToRgba(color, 0.55) },
            { offset: 1, color: hexToRgba(color, 0.12) }
          ]),
          borderColor: color,
          borderWidth: 1,
          borderRadius: [12, 12, 0, 0],
          shadowBlur: 12,
          shadowColor: hexToRgba(color, 0.18),
          shadowOffsetY: 4
        },
        emphasis: {
          focus: 'self',
          itemStyle: {
            shadowBlur: 18,
            shadowOffsetY: 6
          }
        }
      }
    ]
  };
}

export function buildBarHorizontalOption(
  labels: string[],
  values: number[],
  color: string
): EChartsOption {
  return {
    textStyle: {
      fontFamily: DASHBOARD_CHART_FONT,
      color: CHART_COLORS.legendText
    },
    ...chartAnimation(),
    grid: gridCompactHorizontal(),
    tooltip: {
      ...tooltipAxis(),
      axisPointer: {
        type: 'shadow',
        shadowStyle: { color: 'rgba(15, 23, 42, 0.06)' }
      }
    },
    xAxis: {
      type: 'value',
      position: 'bottom',
      splitLine: {
        lineStyle: { color: CHART_COLORS.grid, type: 'dashed', width: 1 }
      },
      axisLabel: { ...text(11, CHART_COLORS.axisLabel) }
    },
    yAxis: {
      type: 'category',
      position: 'left',
      data: labels,
      inverse: true,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        ...text(12, CHART_COLORS.axisLabel),
        width: 118,
        overflow: 'truncate'
      }
    },
    series: [
      {
        type: 'bar',
        data: values,
        barMaxWidth: 28,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
            { offset: 0, color: hexToRgba(color, 0.55) },
            { offset: 1, color: hexToRgba(color, 0.12) }
          ]),
          borderColor: color,
          borderWidth: 1,
          borderRadius: [0, 12, 12, 0],
          shadowBlur: 10,
          shadowColor: hexToRgba(color, 0.16),
          shadowOffsetX: 3
        },
        emphasis: {
          focus: 'self',
          itemStyle: {
            shadowBlur: 16,
            shadowOffsetX: 5
          }
        }
      }
    ]
  };
}

/** Simple vertical bar (doughnut component toggle) — no gradient horizontal */
export function buildBarVerticalSimpleOption(
  labels: string[],
  values: number[],
  color: string
): EChartsOption {
  return {
    textStyle: {
      fontFamily: DASHBOARD_CHART_FONT,
      color: CHART_COLORS.legendText
    },
    ...chartAnimation(),
    grid: gridCompactCartesian(),
    tooltip: {
      ...tooltipAxis(),
      axisPointer: {
        type: 'shadow',
        shadowStyle: { color: 'rgba(15, 23, 42, 0.06)' }
      }
    },
    xAxis: {
      type: 'category',
      position: 'bottom',
      data: labels,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        ...text(12, CHART_COLORS.axisLabel),
        rotate: 40,
        interval: 0
      }
    },
    yAxis: {
      type: 'value',
      position: 'left',
      splitLine: {
        lineStyle: { color: CHART_COLORS.grid, type: 'dashed', width: 1 }
      },
      axisLabel: { ...text(11, CHART_COLORS.axisLabel) }
    },
    series: [
      {
        type: 'bar',
        data: values,
        barMaxWidth: 40,
        itemStyle: {
          color: hexToRgba(color, 0.32),
          borderColor: color,
          borderWidth: 1,
          borderRadius: [8, 8, 0, 0],
          shadowBlur: 8,
          shadowColor: hexToRgba(color, 0.12),
          shadowOffsetY: 3
        }
      }
    ]
  };
}

export function buildRadarOption(
  labels: string[],
  values: number[],
  color: string
): EChartsOption {
  const maxVal = Math.max(...values, 0);
  const max = maxVal > 0 ? maxVal * 1.15 : 1;
  return {
    textStyle: {
      fontFamily: DASHBOARD_CHART_FONT,
      color: CHART_COLORS.legendText
    },
    ...chartAnimation(),
    tooltip: tooltipItem(),
    radar: {
      indicator: labels.map(name => ({ name, max })),
      splitLine: { lineStyle: { color: CHART_COLORS.grid, type: 'dashed' } },
      splitArea: {
        show: true,
        areaStyle: {
          color: ['rgba(148, 163, 184, 0.06)', 'rgba(148, 163, 184, 0.02)']
        }
      },
      axisLine: { lineStyle: { color: CHART_COLORS.grid } },
      axisName: {
        color: CHART_COLORS.axisLabel,
        fontFamily: DASHBOARD_CHART_FONT,
        fontSize: 11
      },
      axisLabel: {
        color: CHART_COLORS.axisLabel,
        fontFamily: DASHBOARD_CHART_FONT,
        fontSize: 10
      }
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: values,
            name: '',
            areaStyle: { color: hexToRgba(color, 0.2) },
            lineStyle: { color, width: 2 },
            itemStyle: {
              color,
              borderColor: '#ffffff',
              borderWidth: 2
            }
          }
        ]
      }
    ]
  };
}

export function buildPolarAreaRoseOption(
  labels: string[],
  values: number[],
  paletteColors: string[]
): EChartsOption {
  const data = labels.map((name, i) => ({
    name,
    value: values[i],
    itemStyle: {
      color: hexToRgba(paletteColors[i % paletteColors.length]!, 0.72),
      borderColor: 'rgba(255,255,255,0.92)',
      borderWidth: 2
    }
  }));
  return {
    textStyle: {
      fontFamily: DASHBOARD_CHART_FONT,
      color: CHART_COLORS.legendText
    },
    ...chartAnimation(),
    tooltip: tooltipItem(),
    legend: {
      bottom: 0,
      left: 'center',
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      textStyle: {
        fontFamily: DASHBOARD_CHART_FONT,
        fontSize: 12,
        color: CHART_COLORS.legendText,
        padding: [0, 0, 0, 4]
      },
      itemGap: 12
    },
    series: [
      {
        type: 'pie',
        roseType: 'area',
        radius: [18, '66%'],
        center: ['50%', '44%'],
        label: { show: false },
        padAngle: 2,
        data
      }
    ]
  };
}

export function buildDoughnutOption(
  labels: string[],
  values: number[],
  paletteColors: string[],
  cutoutInnerPercent = 48,
  cutoutOuterPercent = 72
): EChartsOption {
  const data = labels.map((name, i) => ({
    name,
    value: values[i],
    itemStyle: {
      color: paletteColors[i % paletteColors.length],
      borderColor: '#fff',
      borderWidth: 2,
      borderRadius: 6
    }
  }));
  return {
    textStyle: {
      fontFamily: DASHBOARD_CHART_FONT,
      color: CHART_COLORS.legendText
    },
    ...chartAnimation(),
    tooltip: tooltipItem(),
    legend: {
      orient: 'horizontal',
      bottom: 0,
      left: 'center',
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      textStyle: {
        fontFamily: DASHBOARD_CHART_FONT,
        fontSize: 12,
        color: CHART_COLORS.legendText,
        padding: [0, 0, 0, 4]
      },
      itemGap: 16
    },
    series: [
      {
        type: 'pie',
        radius: [`${cutoutInnerPercent}%`, `${cutoutOuterPercent}%`],
        center: ['50%', '42%'],
        avoidLabelOverlap: true,
        padAngle: 2,
        label: { show: false },
        emphasis: {
          scale: true,
          scaleSize: 6
        },
        data
      }
    ]
  };
}

export function buildPieOption(
  labels: string[],
  values: number[],
  paletteColors: string[]
): EChartsOption {
  const data = labels.map((name, i) => ({
    name,
    value: values[i],
    itemStyle: {
      color: paletteColors[i % paletteColors.length],
      borderColor: '#fff',
      borderWidth: 2
    }
  }));
  return {
    textStyle: {
      fontFamily: DASHBOARD_CHART_FONT,
      color: CHART_COLORS.legendText
    },
    ...chartAnimation(),
    tooltip: tooltipItem(),
    legend: {
      orient: 'horizontal',
      bottom: 0,
      left: 'center',
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      textStyle: {
        fontFamily: DASHBOARD_CHART_FONT,
        fontSize: 12,
        color: CHART_COLORS.legendText,
        padding: [0, 0, 0, 4]
      },
      itemGap: 14
    },
    series: [
      {
        type: 'pie',
        radius: ['0%', '62%'],
        center: ['50%', '42%'],
        padAngle: 1.5,
        label: { show: false },
        data
      }
    ]
  };
}

/** Grouped vertical bars (e.g. Impact comparison) — same series semantics as Chart.js grouped bar */
export interface GroupedBarSeriesInput {
  name: string;
  /** Values as returned from the API; null/undefined gaps are preserved for display */
  data: (number | null | undefined)[];
  /** Hex or css color — used for gradient + shadow */
  color: string;
}

export function buildGroupedBarVerticalOption(
  categories: string[],
  seriesList: GroupedBarSeriesInput[],
  yAxis?: { min?: number; max?: number }
): EChartsOption {
  const legendRows = seriesList.length > 2 ? 1 : 0;
  return {
    textStyle: {
      fontFamily: DASHBOARD_CHART_FONT,
      color: CHART_COLORS.legendText
    },
    ...chartAnimation(),
    grid: {
      left: 52,
      right: 18,
      top: 22,
      bottom: 88 + legendRows * 14,
      containLabel: false
    },
    tooltip: {
      ...tooltipAxis(),
      axisPointer: {
        type: 'shadow',
        shadowStyle: { color: 'rgba(15, 23, 42, 0.07)' }
      }
    },
    legend: {
      bottom: 4,
      left: 'center',
      icon: 'roundRect',
      itemWidth: 12,
      itemHeight: 8,
      itemGap: 18,
      textStyle: {
        fontFamily: DASHBOARD_CHART_FONT,
        fontSize: 12,
        color: CHART_COLORS.legendText
      }
    },
    xAxis: {
      type: 'category',
      position: 'bottom',
      data: categories,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        ...text(11, CHART_COLORS.axisLabel),
        rotate: categories.length > 6 ? 32 : 0,
        interval: 0,
        hideOverlap: true
      }
    },
    yAxis: {
      type: 'value',
      position: 'left',
      min: yAxis?.min,
      max: yAxis?.max,
      splitLine: {
        lineStyle: { color: CHART_COLORS.grid, type: 'dashed', width: 1 }
      },
      axisLabel: { ...text(11, CHART_COLORS.axisLabel) }
    },
    series: seriesList.map(s => ({
      name: s.name,
      type: 'bar' as const,
      data: s.data.map(v => (v == null || Number.isNaN(v as number) ? null : v)),
      barMaxWidth: 22,
      barGap: '12%',
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: hexToRgba(s.color, 0.92) },
          { offset: 1, color: hexToRgba(s.color, 0.38) }
        ]),
        borderRadius: [8, 8, 2, 2],
        shadowBlur: 10,
        shadowColor: hexToRgba(s.color, 0.22),
        shadowOffsetY: 3
      },
      emphasis: {
        focus: 'series',
        itemStyle: {
          shadowBlur: 16,
          shadowOffsetY: 5
        }
      }
    }))
  };
}

/** Line fill style matching previous bar-chart line mode (flat area, no gradient) */
export function buildLineSimpleOption(
  labels: string[],
  values: number[],
  color: string
): EChartsOption {
  const base = buildLineOption(labels, values, color);
  const prev = base.series as Record<string, unknown>[];
  const first = prev[0];
  if (!first) return base;
  return {
    ...base,
    series: [{ ...first, areaStyle: { color: hexToRgba(color, 0.12) } }]
  };
}
