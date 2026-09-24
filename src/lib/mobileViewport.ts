export function getMobileNavBottomOffset(
  layoutHeight: number,
  visualOffsetTop: number,
  visualHeight: number,
) {
  if (
    !Number.isFinite(layoutHeight) ||
    !Number.isFinite(visualOffsetTop) ||
    !Number.isFinite(visualHeight)
  ) {
    return 0;
  }

  const visualBottom = visualOffsetTop + visualHeight;
  const offset = layoutHeight - visualBottom;
  return Math.abs(offset) < 0.5 ? 0 : offset;
}
