export function isIOSWebKit(
  userAgent: string,
  platform = '',
  maxTouchPoints = 0,
) {
  return /iPhone|iPad|iPod/i.test(userAgent)
    || (platform === 'MacIntel' && maxTouchPoints > 1);
}

export function getMobileNavDocumentTop(
  visualPageTop: number,
  visualHeight: number,
  navHeight: number,
) {
  if (
    !Number.isFinite(visualPageTop) ||
    !Number.isFinite(visualHeight) ||
    !Number.isFinite(navHeight) ||
    visualHeight <= 0 ||
    navHeight <= 0
  ) {
    return 0;
  }

  return Math.max(visualPageTop, visualPageTop + visualHeight - navHeight);
}

export function getRealLayoutMaxScrollTop(
  contentBottom: number,
  visualOffsetTop: number,
  visualHeight: number,
) {
  if (
    !Number.isFinite(contentBottom) ||
    !Number.isFinite(visualOffsetTop) ||
    !Number.isFinite(visualHeight) ||
    contentBottom <= 0 ||
    visualHeight <= 0
  ) {
    return 0;
  }

  return Math.max(0, contentBottom - visualOffsetTop - visualHeight);
}

export function isPhantomBottomScroll(
  layoutScrollTop: number,
  maxLayoutScrollTop: number,
  tolerance = 2,
) {
  return Number.isFinite(layoutScrollTop)
    && Number.isFinite(maxLayoutScrollTop)
    && layoutScrollTop > maxLayoutScrollTop + tolerance;
}
