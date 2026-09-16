import { useEffect, useRef, useState } from 'react'

export default function MagicCursor() {
  const cursorRef = useRef(null)
  const dotRef = useRef(null)
  const [hovering, setHovering] = useState(false)
  const particles = useRef([])
  const mouse = useRef({ x: 0, y: 0 })
  const rafId = useRef(null)

  useEffect(() => {
    const cursor = cursorRef.current
    const dot = dotRef.current
    if (!cursor || !dot) return

    // Smooth cursor follow
    let curX = 0, curY = 0
    const animate = () => {
      curX += (mouse.current.x - curX) * 0.12
      curY += (mouse.current.y - curY) * 0.12
      cursor.style.left = curX + 'px'
      cursor.style.top = curY + 'px'
      rafId.current = requestAnimationFrame(animate)
    }
    animate()

    const onMove = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY }
      dot.style.left = e.clientX + 'px'
      dot.style.top = e.clientY + 'px'
      spawnParticle(e.clientX, e.clientY)
    }

    const onClick = (e) => {
      spawnRipple(e.clientX, e.clientY)
      spawnBurst(e.clientX, e.clientY)
    }

    const onEnterInteractive = () => setHovering(true)
    const onLeaveInteractive = () => setHovering(false)

    document.addEventListener('mousemove', onMove)
    document.addEventListener('click', onClick)

    const interactives = document.querySelectorAll('a,button,[data-cursor]')
    interactives.forEach(el => {
      el.addEventListener('mouseenter', onEnterInteractive)
      el.addEventListener('mouseleave', onLeaveInteractive)
    })

    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('click', onClick)
      cancelAnimationFrame(rafId.current)
    }
  }, [])

  // Update hovering class
  useEffect(() => {
    const cursor = cursorRef.current
    if (!cursor) return
    if (hovering) cursor.classList.add('hovering')
    else cursor.classList.remove('hovering')
  }, [hovering])

  function spawnParticle(x, y) {
    const el = document.createElement('div')
    const size = Math.random() * 6 + 2
    const colors = ['#7c3aed', '#6366f1', '#06b6d4', '#a855f7', '#3b82f6']
    const color = colors[Math.floor(Math.random() * colors.length)]
    el.style.cssText = `
      position:fixed; pointer-events:none; z-index:99998;
      width:${size}px; height:${size}px;
      left:${x + (Math.random()-0.5)*20}px;
      top:${y + (Math.random()-0.5)*20}px;
      border-radius:50%;
      background:${color};
      box-shadow:0 0 ${size*2}px ${color};
      animation:particleFade 0.8s ease forwards;
    `
    document.body.appendChild(el)
    setTimeout(() => el.remove(), 800)
  }

  function spawnRipple(x, y) {
    const el = document.createElement('div')
    el.className = 'ripple'
    el.style.cssText = `left:${x}px; top:${y}px;`
    document.body.appendChild(el)
    setTimeout(() => el.remove(), 600)
  }

  function spawnBurst(x, y) {
    for (let i = 0; i < 8; i++) {
      const el = document.createElement('div')
      const angle = (i / 8) * Math.PI * 2
      const dist = 30 + Math.random() * 20
      const size = Math.random() * 5 + 2
      el.style.cssText = `
        position:fixed; pointer-events:none; z-index:99998;
        width:${size}px; height:${size}px;
        left:${x}px; top:${y}px;
        border-radius:50%;
        background:#7c3aed;
        box-shadow:0 0 10px #7c3aed;
        animation:burstParticle 0.5s ease forwards;
        --dx:${Math.cos(angle) * dist}px;
        --dy:${Math.sin(angle) * dist}px;
      `
      document.body.appendChild(el)
      el.animate([
        { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(angle)*dist}px), calc(-50% + ${Math.sin(angle)*dist}px)) scale(0)`, opacity: 0 }
      ], { duration: 500, easing: 'ease-out', fill: 'forwards' })
      setTimeout(() => el.remove(), 500)
    }
  }

  return (
    <>
      <div ref={cursorRef} className="cursor-main" />
      <div ref={dotRef} className="cursor-dot" />
    </>
  )
}
