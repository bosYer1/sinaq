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

export function getRealPageMaxTop(
  contentBottom: number,
  visualHeight: number,
) {
  if (
    !Number.isFinite(contentBottom) ||
    !Number.isFinite(visualHeight) ||
    contentBottom <= 0 ||
    visualHeight <= 0
  ) {
    return 0;
  }

  return Math.max(0, contentBottom - visualHeight);
}

export function isPhantomBottomScroll(
  visualPageTop: number,
  maxPageTop: number,
  tolerance = 2,
) {
  return Number.isFinite(visualPageTop)
    && Number.isFinite(maxPageTop)
    && visualPageTop > maxPageTop + tolerance;
}


export function getLayoutScrollTopForVisualPageTop(
  visualPageTop: number,
  visualOffsetTop: number,
) {
  if (!Number.isFinite(visualPageTop) || !Number.isFinite(visualOffsetTop)) return 0;
  return Math.max(0, visualPageTop - visualOffsetTop);
}
