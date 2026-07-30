/**
 * Minimal trend line.
 *
 * Hand-rolled SVG rather than a chart library: seven points need a path, not a
 * rendering engine, and this keeps the metric card's chunk tiny.
 *
 * The viewBox is a fixed coordinate space with `preserveAspectRatio="none"`, so
 * the line stretches to whatever box the card gives it without recomputing
 * anything on resize.
 */
export function Sparkline({
  values,
  className,
}: {
  values: number[];
  className?: string;
}) {
  if (values.length < 2) return null;

  const width = 100;
  const height = 32;
  const min = Math.min(...values);
  const max = Math.max(...values);
  // Flat series would divide by zero; render them as a centred straight line.
  const span = max - min || 1;

  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = height - ((value - min) / span) * height;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  const line = `M ${points.join(' L ')}`;
  const area = `${line} L ${width},${height} L 0,${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d={area} fill="currentColor" opacity={0.12} />
      <path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
