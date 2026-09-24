export function getMobileNavVisualTop(
  visualOffsetTop: number,
  visualHeight: number,
  navHeight: number,
) {
  if (
    !Number.isFinite(visualOffsetTop) ||
    !Number.isFinite(visualHeight) ||
    !Number.isFinite(navHeight) ||
    visualHeight <= 0 ||
    navHeight <= 0
  ) {
    return 0;
  }

  return Math.max(visualOffsetTop, visualOffsetTop + visualHeight - navHeight);
}
