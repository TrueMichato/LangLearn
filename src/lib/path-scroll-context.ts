export interface PathScrollItem {
  id: string;
  top: number;
  bottom: number;
}

export function activePathUnitId(
  items: readonly PathScrollItem[],
  activationLine: number,
): string | null {
  const containing = items.find(
    (item) => item.top <= activationLine && item.bottom > activationLine,
  );
  if (containing) return containing.id;

  return (
    items.find((item) => item.top > activationLine)?.id ??
    items.at(-1)?.id ??
    null
  );
}
