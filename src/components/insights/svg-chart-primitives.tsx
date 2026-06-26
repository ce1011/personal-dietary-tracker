export function linearScale(
  domain: [number, number],
  range: [number, number]
): (value: number) => number {
  const [d0, d1] = domain
  const [r0, r1] = range
  if (d1 === d0) return () => (r0 + r1) / 2
  return (value: number) => r0 + ((value - d0) / (d1 - d0)) * (r1 - r0)
}

export function buildLinePath(
  points: Array<{ x: number; y: number }>
): string {
  if (points.length === 0) return ""
  return points
    .map((point, index) =>
      `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`
    )
    .join(" ")
}

export function niceBounds(
  min: number,
  max: number,
  padding = 0.1
): [number, number] {
  if (min === max) {
    const amount = Math.abs(min) * padding || 1
    return [min - amount, max + amount]
  }
  const span = max - min
  return [min - span * padding, max + span * padding]
}

export function tickDates(start: Date, end: Date, count: number): Date[] {
  const startMs = start.getTime()
  const endMs = end.getTime()
  if (count <= 1) return [new Date(startMs)]
  const step = (endMs - startMs) / (count - 1)
  return Array.from({ length: count }, (_, index) => new Date(startMs + step * index))
}
