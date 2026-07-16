import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import './NavMenu.css'

export function NavMenu() {
  const navigate = useNavigate()

  const triggerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const highlightPillRef = useRef<HTMLDivElement>(null)
  const navContentRef = useRef<HTMLDivElement>(null)

  const [menuOpen, setMenuOpen] = useState(false)

  const menuOpenRef = useRef(false)
  const highlightedRef = useRef<Element | null>(null)
  const draggingRef = useRef(false)
  const touchOriginRef = useRef({ x: 0, y: 0 })
  const morphRafRef = useRef<number | null>(null)

  const snapPanelToButton = useCallback(() => {
    const trigger = triggerRef.current
    const panel = panelRef.current
    if (!trigger || !panel) return
    const r = trigger.getBoundingClientRect()
    panel.style.left = 'auto'
    panel.style.right = window.innerWidth - r.right + 'px'
    panel.style.bottom = window.innerHeight - r.bottom + 'px'
    panel.style.top = 'auto'
  }, [])

  const clearHighlight = useCallback(() => {
    if (highlightedRef.current) {
      highlightedRef.current.classList.remove('bn-hi')
      highlightedRef.current = null
    }
    highlightPillRef.current?.classList.remove('bn-highlight-visible')
  }, [])

  const openMenu = useCallback(() => {
    if (menuOpenRef.current) return
    menuOpenRef.current = true
    setMenuOpen(true)
    snapPanelToButton()
    requestAnimationFrame(() => {
      panelRef.current?.classList.add('bn-panel-open')
      overlayRef.current?.classList.add('bn-overlay-active')
      triggerRef.current?.classList.add('bn-menu-open')
    })
  }, [snapPanelToButton])

  const closeMenu = useCallback(() => {
    if (!menuOpenRef.current) return
    menuOpenRef.current = false
    setMenuOpen(false)
    panelRef.current?.classList.remove('bn-panel-open')
    overlayRef.current?.classList.remove('bn-overlay-active')
    triggerRef.current?.classList.remove('bn-menu-open')
    clearHighlight()
    draggingRef.current = false
  }, [clearHighlight])

  const hitNavItem = (x: number, y: number) => {
    for (const el of document.elementsFromPoint(x, y)) {
      const m = el.closest('.bn-nav-row, .bn-tile')
      if (m) return m
    }
    return null
  }

  const applyMorph = (direction: 'h' | 'v') => {
    const panel = panelRef.current
    if (!panel) return
    if (morphRafRef.current) cancelAnimationFrame(morphRafRef.current)
    panel.dataset.morph = direction
    morphRafRef.current = requestAnimationFrame(() => {
      morphRafRef.current = requestAnimationFrame(() => {
        delete panel.dataset.morph
      })
    })
  }

  const setHighlightAt = (x: number, y: number) => {
    const target = hitNavItem(x, y)
    if (target === highlightedRef.current) return

    const prevTarget = highlightedRef.current
    if (prevTarget) prevTarget.classList.remove('bn-hi')
    highlightedRef.current = null

    const pill = highlightPillRef.current
    const navContent = navContentRef.current

    if (target) {
      target.classList.add('bn-hi')
      highlightedRef.current = target

      if (pill && navContent) {
        const contentRect = navContent.getBoundingClientRect()
        const targetRect = target.getBoundingClientRect()

        if (prevTarget) {
          const prevRect = prevTarget.getBoundingClientRect()
          const dx = Math.abs(targetRect.left + targetRect.width / 2 - prevRect.left - prevRect.width / 2)
          const dy = Math.abs(targetRect.top + targetRect.height / 2 - prevRect.top - prevRect.height / 2)
          applyMorph(dx > dy ? 'h' : 'v')
        }

        pill.style.left = `${targetRect.left - contentRect.left}px`
        pill.style.top = `${targetRect.top - contentRect.top}px`
        pill.style.width = `${targetRect.width}px`
        pill.style.height = `${targetRect.height}px`
        pill.classList.add('bn-highlight-visible')
      }
    } else {
      pill?.classList.remove('bn-highlight-visible')
    }
  }

  const doNavigate = useCallback((route: string) => {
    closeMenu()
    navigate('/' + route)
  }, [closeMenu, navigate])

  const touchHandlers = useRef({
    triggerStart: (_e: TouchEvent) => {},
    triggerMove: (_e: TouchEvent) => {},
    triggerEnd: (_e: TouchEvent) => {},
    panelMove: (_e: TouchEvent) => {},
    panelEnd: (_e: TouchEvent) => {},
  })

  touchHandlers.current = {
    triggerStart(e) {
      e.preventDefault()
      touchOriginRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      draggingRef.current = false
      if (!menuOpenRef.current) openMenu()
    },
    triggerMove(e) {
      e.preventDefault()
      const t = e.touches[0]
      if (
        Math.abs(t.clientX - touchOriginRef.current.x) > 6 ||
        Math.abs(t.clientY - touchOriginRef.current.y) > 6
      ) draggingRef.current = true
      if (draggingRef.current) setHighlightAt(t.clientX, t.clientY)
    },
    triggerEnd(e) {
      e.preventDefault()
      if (draggingRef.current && highlightedRef.current) {
        const route = (highlightedRef.current as HTMLElement).dataset.route
        if (route) doNavigate(route)
        else closeMenu()
      }
    },
    panelMove(e) {
      e.preventDefault()
      draggingRef.current = true
      const t = e.touches[0]
      setHighlightAt(t.clientX, t.clientY)
    },
    panelEnd(e) {
      e.preventDefault()
      const t = e.changedTouches[0]
      const target = hitNavItem(t.clientX, t.clientY)
      const route = (target as HTMLElement | null)?.dataset.route
      if (route) doNavigate(route)
      else closeMenu()
    },
  }

  useEffect(() => {
    const trigger = triggerRef.current
    const panel = panelRef.current
    if (!trigger || !panel) return

    const ts = (e: TouchEvent) => touchHandlers.current.triggerStart(e)
    const tm = (e: TouchEvent) => touchHandlers.current.triggerMove(e)
    const te = (e: TouchEvent) => touchHandlers.current.triggerEnd(e)
    const pm = (e: TouchEvent) => touchHandlers.current.panelMove(e)
    const pe = (e: TouchEvent) => touchHandlers.current.panelEnd(e)

    trigger.addEventListener('touchstart', ts, { passive: false })
    trigger.addEventListener('touchmove', tm, { passive: false })
    trigger.addEventListener('touchend', te, { passive: false })
    panel.addEventListener('touchmove', pm, { passive: false })
    panel.addEventListener('touchend', pe, { passive: false })

    return () => {
      trigger.removeEventListener('touchstart', ts)
      trigger.removeEventListener('touchmove', tm)
      trigger.removeEventListener('touchend', te)
      panel.removeEventListener('touchmove', pm)
      panel.removeEventListener('touchend', pe)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onResize = () => { if (menuOpenRef.current) snapPanelToButton() }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [snapPanelToButton])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && menuOpenRef.current) closeMenu() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [closeMenu])

  const onTriggerClick = () => {
    if ('ontouchstart' in window) return
    menuOpenRef.current ? closeMenu() : openMenu()
  }

  return (
    <>
      <div ref={overlayRef} className="bn-overlay" onClick={closeMenu} />

      <nav ref={panelRef} className="bn-panel" aria-label="Main navigation">
        <div ref={navContentRef} className="bn-nav-content">
          <div ref={highlightPillRef} className="bn-highlight" />
          <div className="bn-nav-row" data-route="settings" onClick={() => doNavigate('settings')}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            Settings
          </div>

          <div className="bn-nav-row" data-route="goals" onClick={() => doNavigate('goals')}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="6"/>
              <circle cx="12" cy="12" r="2"/>
            </svg>
            Goals
          </div>

          <div className="bn-sep" />

          <div className="bn-tiles">
            <div className="bn-tile" data-route="sprint/current" onClick={() => doNavigate('sprint/current')}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
              Current
            </div>
            <div className="bn-tile" data-route="sprint/next" onClick={() => doNavigate('sprint/next')}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 8 16 12 12 16"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
              Next
            </div>
            <div className="bn-tile" data-route="backlog" onClick={() => doNavigate('backlog')}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"/>
                <line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/>
                <circle cx="3.5" cy="6" r="0.6" fill="currentColor" stroke="none"/>
                <circle cx="3.5" cy="12" r="0.6" fill="currentColor" stroke="none"/>
                <circle cx="3.5" cy="18" r="0.6" fill="currentColor" stroke="none"/>
              </svg>
              Backlog
            </div>
          </div>
        </div>
      </nav>

      <div
        ref={triggerRef}
        className="bn-trigger"
        role="button"
        aria-label="Open navigation"
        aria-expanded={menuOpen}
        aria-haspopup="true"
        onClick={onTriggerClick}
      >
        <div className="bn-hamburger">
          <span /><span /><span />
        </div>
      </div>
    </>
  )
}
