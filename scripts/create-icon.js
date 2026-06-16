#!/usr/bin/env node
// Generates resources/icon.png (512x512) using only Node.js built-in modules
const { deflateSync } = require('zlib')
const { writeFileSync, mkdirSync } = require('fs')
const { join } = require('path')

const TABLE = new Uint32Array(256)
for (let i = 0; i < 256; i++) {
  let c = i
  for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  TABLE[i] = c
}
function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const t = Buffer.from(type), l = Buffer.allocUnsafe(4), cr = Buffer.allocUnsafe(4)
  l.writeUInt32BE(data.length); cr.writeUInt32BE(crc32(Buffer.concat([t, data])))
  return Buffer.concat([l, t, data, cr])
}
function makePNG(size, fn) {
  const rows = []
  for (let y = 0; y < size; y++) {
    const row = Buffer.allocUnsafe(1 + size * 4); row[0] = 0
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = fn(x, y, size)
      row[1 + x*4] = r; row[2 + x*4] = g; row[3 + x*4] = b; row[4 + x*4] = a
    }
    rows.push(row)
  }
  const idat = deflateSync(Buffer.concat(rows))
  const ihdr = Buffer.allocUnsafe(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 6
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR',ihdr), chunk('IDAT',idat), chunk('IEND',Buffer.alloc(0))])
}

function drawIcon(x, y, s) {
  const cx = s * 0.5
  const m = s * 0.04, r = s * 0.18
  // Rounded rect check
  const inRR = () => {
    if (x<m||x>s-m||y<m||y>s-m) return false
    if (x<m+r&&y<m+r) return Math.hypot(x-(m+r),y-(m+r))<=r
    if (x>s-m-r&&y<m+r) return Math.hypot(x-(s-m-r),y-(m+r))<=r
    if (x>s-m-r&&y>s-m-r) return Math.hypot(x-(s-m-r),y-(s-m-r))<=r
    if (x<m+r&&y>s-m-r) return Math.hypot(x-(m+r),y-(s-m-r))<=r
    return true
  }
  if (!inRR()) return [0,0,0,0]

  // Background gradient: deep navy #111D3A → #1a2d5a
  const t = (y-m)/(s-2*m)
  const bgR=Math.round(17+t*9), bgG=Math.round(29+t*16), bgB=Math.round(58+t*32)

  // Cap geometry
  const capCY = s*0.44
  // Brim
  const b1=capCY-s*0.028, b2=capCY+s*0.038, bx1=cx-s*0.26, bx2=cx+s*0.26
  if (x>=bx1&&x<=bx2&&y>=b1&&y<=b2) return [255,255,255,255]
  // Cap top (trapezoid)
  if (y>=capCY-s*0.2&&y<=b1) {
    const prog=(y-(capCY-s*0.2))/(b1-(capCY-s*0.2))
    const hw=s*0.09+prog*s*0.13
    if (x>=cx-hw&&x<=cx+hw) return [255,255,255,255]
  }
  // Center board (rotated square)
  if (Math.abs(x-cx)+Math.abs(y-capCY)<=s*0.055) return [255,255,255,255]
  // Tassel line
  const tx=cx+s*0.26
  if (x>=tx-s*0.012&&x<=tx+s*0.012&&y>=b2&&y<=b2+s*0.15) return [255,255,255,255]
  if (Math.hypot(x-tx,y-(b2+s*0.18))<=s*0.028) return [255,255,255,255]

  // "C" letter (for Coaching/Fee) - pixel-drawn at bottom
  const lcy=s*0.73, lcx=cx, lR=s*0.075, lrR=s*0.045, thick=s*0.022
  const outer=Math.hypot(x-lcx,y-lcy)<=lR, inner=Math.hypot(x-lcx,y-lcy)<=lR-thick
  const notchX=lcx+lR*0.1, notchW=s*0.06, notchH=s*0.05
  const inNotch=x>=notchX&&x<=notchX+notchW&&y>=lcy-notchH&&y<=lcy+notchH
  if (outer&&!inner&&!inNotch) return [100,160,255,255]

  // Bottom accent glow
  if (y>s*0.8) {
    const gt=(y-s*0.8)/(s*0.16-m)
    return [Math.round(bgR+(66-bgR)*gt*0.25), Math.round(bgG+(133-bgG)*gt*0.25), Math.round(bgB+(244-bgB)*gt*0.35), 255]
  }
  return [bgR, bgG, bgB, 255]
}

const dir = join(__dirname, '..', 'resources')
mkdirSync(dir, { recursive: true })
console.log('Generating icon...')
writeFileSync(join(dir, 'icon.png'), makePNG(512, drawIcon))
console.log('✓ resources/icon.png (512×512)')
