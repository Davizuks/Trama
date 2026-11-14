export type Layout =
  'desktop' | 'tablet-landscape' | 'tablet-portrait' | 'phone-landscape' | 'phone'

// As quebras @media do CSS repetem estes valores: mudou aqui, mude lá.
const PHONE_MAX_WIDTH = 600
const PHONE_LANDSCAPE_MAX_HEIGHT = 500
const TABLET_PORTRAIT_MAX_WIDTH = 900
const TABLET_LANDSCAPE_MAX_WIDTH = 1200

export function layoutFor(width: number, height: number): Layout {
  if (width < PHONE_MAX_WIDTH) return 'phone'
  if (height < PHONE_LANDSCAPE_MAX_HEIGHT) return 'phone-landscape'
  if (width < TABLET_PORTRAIT_MAX_WIDTH) return 'tablet-portrait'
  if (width < TABLET_LANDSCAPE_MAX_WIDTH) return 'tablet-landscape'
  return 'desktop'
}

export function hasSidebar(layout: Layout): boolean {
  return layout === 'desktop' || layout === 'tablet-landscape' || layout === 'phone-landscape'
}
