/**
 * Servidor simple de actualizaciones para Tauri
 * Sirve los archivos JSON y binarios para el auto-updater
 */

const http = require('http')
const fs = require('fs')
const path = require('path')
const url = require('url')

const PORT = 3002
const UPDATES_DIR = path.join(__dirname, 'updates')
const RELEASES_DIR = path.join(UPDATES_DIR, 'releases')

// Crear directorios si no existen
if (!fs.existsSync(UPDATES_DIR)) {
  fs.mkdirSync(UPDATES_DIR, { recursive: true })
}
if (!fs.existsSync(RELEASES_DIR)) {
  fs.mkdirSync(RELEASES_DIR, { recursive: true })
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true)
  const pathname = parsedUrl.pathname

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }

  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${pathname}`)

  // GET /updates/windows-x86_64.json
  // GET /updates/darwin-x86_64.json
  // GET /updates/darwin-aarch64.json
  // GET /updates/linux-x86_64.json
  if (pathname.startsWith('/updates/') && pathname.endsWith('.json')) {
    const filename = path.basename(pathname)
    const filePath = path.join(UPDATES_DIR, filename)

    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Update manifest not found' }))
      return
    }

    const data = fs.readFileSync(filePath, 'utf8')
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(data)
    return
  }

  // GET /updates/releases/*.msi|.exe|.dmg|.AppImage
  if (pathname.startsWith('/updates/releases/')) {
    const filename = pathname.replace('/updates/releases/', '')
    const filePath = path.join(RELEASES_DIR, filename)

    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Release file not found' }))
      return
    }

    const stat = fs.statSync(filePath)
    const ext = path.extname(filename).toLowerCase()

    const contentTypes = {
      '.msi': 'application/x-msi',
      '.exe': 'application/x-msdownload',
      '.dmg': 'application/x-apple-diskimage',
      '.appimage': 'application/x-executable',
      '.deb': 'application/x-deb',
    }

    res.writeHead(200, {
      'Content-Type': contentTypes[ext] || 'application/octet-stream',
      'Content-Length': stat.size,
      'Content-Disposition': `attachment; filename="${filename}"`,
    })

    const fileStream = fs.createReadStream(filePath)
    fileStream.pipe(res)
    return
  }

  // GET /health
  if (pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(
      JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
      })
    )
    return
  }

  // GET / - Dashboard
  if (pathname === '/' || pathname === '/dashboard') {
    const html = generateDashboard()
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(html)
    return
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Endpoint not found' }))
})

function generateDashboard() {
  const manifests = fs.readdirSync(UPDATES_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(UPDATES_DIR, f), 'utf8'))
        return {
          platform: f.replace('.json', ''),
          version: data.version,
          pubDate: data.pub_date,
        }
      } catch {
        return null
      }
    })
    .filter(Boolean)

  const releases = fs.existsSync(RELEASES_DIR)
    ? fs.readdirSync(RELEASES_DIR).map(f => {
        const stat = fs.statSync(path.join(RELEASES_DIR, f))
        return {
          name: f,
          size: (stat.size / 1024 / 1024).toFixed(2) + ' MB',
          date: stat.mtime.toLocaleString('es-MX'),
        }
      })
    : []

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Servidor de Actualizaciones - DevNest POS</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      padding: 20px;
      min-height: 100vh;
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
    }
    .header {
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      padding: 40px;
      border-radius: 16px;
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 { font-size: 32px; margin-bottom: 10px; }
    .header p { opacity: 0.9; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 24px;
    }
    .card h2 {
      font-size: 18px;
      margin-bottom: 16px;
      color: #60a5fa;
    }
    .manifest-item {
      background: #0f172a;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 8px;
    }
    .manifest-item h3 {
      font-size: 14px;
      color: #94a3b8;
      margin-bottom: 4px;
    }
    .manifest-item p {
      font-size: 20px;
      font-weight: bold;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      text-align: left;
      padding: 12px;
      border-bottom: 1px solid #334155;
    }
    th {
      background: #0f172a;
      color: #94a3b8;
      font-size: 14px;
    }
    code {
      background: #0f172a;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 13px;
      color: #60a5fa;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      background: #10b981;
      color: white;
    }
    .endpoints {
      background: #0f172a;
      border-radius: 8px;
      padding: 16px;
      margin-top: 16px;
    }
    .endpoint {
      margin-bottom: 12px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
    }
    .endpoint strong {
      color: #60a5fa;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 Servidor de Actualizaciones</h1>
      <p>DevNest POS Desktop - Tauri Update Server</p>
    </div>

    ${
      manifests.length > 0
        ? `
    <div class="card">
      <h2>📦 Versiones Disponibles</h2>
      <div class="grid">
        ${manifests
          .map(
            m => `
          <div class="manifest-item">
            <h3>${m.platform}</h3>
            <p>v${m.version}</p>
            <small style="color: #64748b">${new Date(m.pubDate).toLocaleDateString('es-MX')}</small>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
    `
        : `
    <div class="card">
      <h2>⚠️ No hay actualizaciones configuradas</h2>
      <p style="color: #94a3b8">Coloca los archivos JSON en: <code>update-server/updates/</code></p>
    </div>
    `
    }

    ${
      releases.length > 0
        ? `
    <div class="card">
      <h2>📥 Archivos de Instalación</h2>
      <table>
        <thead>
          <tr>
            <th>Archivo</th>
            <th>Tamaño</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          ${releases
            .map(
              r => `
            <tr>
              <td><code>${r.name}</code></td>
              <td>${r.size}</td>
              <td>${r.date}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>
    `
        : ''
    }

    <div class="card">
      <h2>🔌 API Endpoints</h2>
      <div class="endpoints">
        <div class="endpoint">
          <strong>GET</strong> <code>/updates/windows-x86_64.json</code> - Manifest Windows
        </div>
        <div class="endpoint">
          <strong>GET</strong> <code>/updates/darwin-x86_64.json</code> - Manifest Mac Intel
        </div>
        <div class="endpoint">
          <strong>GET</strong> <code>/updates/darwin-aarch64.json</code> - Manifest Mac M1/M2
        </div>
        <div class="endpoint">
          <strong>GET</strong> <code>/updates/linux-x86_64.json</code> - Manifest Linux
        </div>
        <div class="endpoint">
          <strong>GET</strong> <code>/updates/releases/{filename}</code> - Descargar instalador
        </div>
        <div class="endpoint">
          <strong>GET</strong> <code>/health</code> - Health check
        </div>
      </div>
    </div>

    <div style="text-align: center; margin-top: 30px; color: #64748b; font-size: 14px;">
      DevNest POS Update Server • Puerto ${PORT}
    </div>
  </div>
</body>
</html>
  `
}

server.listen(PORT, () => {
  console.log('\n' + '='.repeat(60))
  console.log('🚀 Servidor de Actualizaciones DevNest POS Desktop')
  console.log('='.repeat(60))
  console.log(`\n✓ Servidor activo en: http://localhost:${PORT}`)
  console.log(`✓ Dashboard: http://localhost:${PORT}/dashboard`)
  console.log(`\n📁 Directorio updates: ${UPDATES_DIR}`)
  console.log(`📁 Directorio releases: ${RELEASES_DIR}`)
  console.log('\nPresiona Ctrl+C para detener\n')
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Error: Puerto ${PORT} ya está en uso`)
    console.error('Detén el otro proceso o cambia el puerto\n')
    process.exit(1)
  } else {
    console.error('\n❌ Error del servidor:', err.message, '\n')
    process.exit(1)
  }
})

process.on('SIGINT', () => {
  console.log('\n\n✓ Servidor detenido\n')
  process.exit(0)
})
