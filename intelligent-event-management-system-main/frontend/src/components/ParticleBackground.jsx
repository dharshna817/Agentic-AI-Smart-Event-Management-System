import { useEffect, useRef } from 'react'

export default function ParticleBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    let particles = []
    let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 }

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const onMouse = (e) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }
    window.addEventListener('mousemove', onMouse)

    // Create particles
    const PARTICLE_COUNT = 80
    const colors = ['#7c3aed', '#6366f1', '#06b6d4', '#a855f7', '#3b82f6']

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2 + 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.6 + 0.2,
        pulseSpeed: Math.random() * 0.02 + 0.01,
        pulseOffset: Math.random() * Math.PI * 2,
      })
    }

    // Blob definitions
    const blobs = [
      { x: 0.2, y: 0.3, r: 300, color: '#7c3aed', vx: 0.0003, vy: 0.0002, phase: 0 },
      { x: 0.8, y: 0.7, r: 250, color: '#06b6d4', vx: -0.0002, vy: 0.0003, phase: 2 },
      { x: 0.5, y: 0.1, r: 200, color: '#6366f1', vx: 0.0001, vy: -0.0002, phase: 4 },
      { x: 0.1, y: 0.8, r: 180, color: '#3b82f6', vx: 0.0002, vy: -0.0001, phase: 1 },
    ]

    let t = 0

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw blobs
      blobs.forEach(blob => {
        const x = canvas.width * (blob.x + Math.sin(t * blob.vx * 1000 + blob.phase) * 0.1)
        const y = canvas.height * (blob.y + Math.cos(t * blob.vy * 1000 + blob.phase) * 0.1)
        const grad = ctx.createRadialGradient(x, y, 0, x, y, blob.r)
        grad.addColorStop(0, blob.color + '28')
        grad.addColorStop(1, 'transparent')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(x, y, blob.r, 0, Math.PI * 2)
        ctx.fill()
      })

      // Mouse glow
      const mouseGrad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 150)
      mouseGrad.addColorStop(0, 'rgba(124,58,237,0.08)')
      mouseGrad.addColorStop(1, 'transparent')
      ctx.fillStyle = mouseGrad
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw particles
      particles.forEach(p => {
        p.x += p.vx
        p.y += p.vy

        // Wrap around
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0

        // Slight attraction to mouse
        const dx = mouse.x - p.x
        const dy = mouse.y - p.y
        const dist = Math.sqrt(dx*dx + dy*dy)
        if (dist < 200) {
          p.vx += dx * 0.000005
          p.vy += dy * 0.000005
        }
        // Dampen
        p.vx *= 0.999
        p.vy *= 0.999

        const pulse = Math.sin(t * p.pulseSpeed * 100 + p.pulseOffset)
        const alpha = p.alpha * (0.7 + pulse * 0.3)
        const size = p.size * (1 + pulse * 0.2)

        ctx.beginPath()
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2)
        ctx.fillStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2,'0')
        ctx.shadowBlur = 8
        ctx.shadowColor = p.color
        ctx.fill()
        ctx.shadowBlur = 0
      })

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i+1; j < particles.length; j++) {
          const p1 = particles[i], p2 = particles[j]
          const dx = p1.x - p2.x
          const dy = p1.y - p2.y
          const dist = Math.sqrt(dx*dx + dy*dy)
          if (dist < 100) {
            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `rgba(124,58,237,${0.15 * (1 - dist/100)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      t += 0.016
      animId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouse)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.9 }}
    />
  )
}
