#!/usr/bin/env node

/**
 * Script para publicar releases en GitHub con firma
 * Uso: node scripts/publish-release.js [version]
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const question = (query) => new Promise((resolve) => rl.question(query, resolve))

// ============================================
// Config
// ============================================

const BUNDLE_DIR = path.join(__dirname, '..', 'src-tauri', 'target', 'release', 'bundle')
const SIGNER_KEY = path.join(process.env.USERPROFILE || process.env.HOME, '.tauri', 'devnest.key')

// ============================================
// Helpers
// ============================================

function log(msg, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
  }
  const symbols = { info: 'ℹ', success: '✓', error: '✗', warning: '⚠' }
  console.log(`${colors[type]}${symbols[type]}\x1b[0m ${msg}`)
}

function exec(cmd, silent = false) {
  try {
    const result = execSync(cmd, { encoding: 'utf8', stdio: silent ? 'pipe' : 'inherit' })
    return result
  } catch (error) {
    throw new Error(`Command failed: ${cmd}`)
  }
}

// ============================================
// Main
// ============================================

async function main() {
  console.log('\n' + '='.repeat(60))
  console.log('🚀 Publicar Release - DevNest POS Desktop')
  console.log('='.repeat(60) + '\n')

  try {
    // 1. Obtener versión
    let version = process.argv[2]
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
    const currentVersion = packageJson.version

    if (!version) {
      version = await question(`Nueva versión (actual: ${currentVersion}): `)
    }

    // Validar formato
    if (!/^\d+\.\d+\.\d+$/.test(version)) {
      log('Formato de versión inválido. Usa X.Y.Z', 'error')
      rl.close()
      process.exit(1)
    }

    log(`Preparando release v${version}`, 'info')

    // 2. Verificar que el build existe
    if (!fs.existsSync(BUNDLE_DIR)) {
      log('No se encontró el directorio de build', 'error')
      log('Ejecuta primero: npm run tauri build', 'warning')
      rl.close()
      process.exit(1)
    }

    // 3. Encontrar instaladores
    const msiDir = path.join(BUNDLE_DIR, 'msi')
    const nsisDir = path.join(BUNDLE_DIR, 'nsis')

    let msiFile = null
    let nsisFile = null

    if (fs.existsSync(msiDir)) {
      const files = fs.readdirSync(msiDir).filter(f => f.endsWith('.msi'))
      msiFile = files[0] ? path.join(msiDir, files[0]) : null
    }

    if (fs.existsSync(nsisDir)) {
      const files = fs.readdirSync(nsisDir).filter(f => f.endsWith('.exe'))
      nsisFile = files[0] ? path.join(nsisDir, files[0]) : null
    }

    if (!msiFile && !nsisFile) {
      log('No se encontraron instaladores (.msi o .exe)', 'error')
      rl.close()
      process.exit(1)
    }

    log(`Instalador encontrado: ${msiFile ? path.basename(msiFile) : path.basename(nsisFile)}`, 'success')

    // 4. Verificar que exista la clave de firma
    if (!fs.existsSync(SIGNER_KEY)) {
      log('Clave de firma no encontrada', 'error')
      log(`Genera una con: npm run tauri signer generate -- -w ${SIGNER_KEY}`, 'warning')
      rl.close()
      process.exit(1)
    }

    // 5. Firmar instalador
    log('Firmando instalador...', 'info')
    const fileToSign = msiFile || nsisFile
    const signatureOutput = exec(`npm run tauri signer sign "${fileToSign}" -- -k "${SIGNER_KEY}"`, true)

    // Extraer firma del output
    const signatureMatch = signatureOutput.match(/Signature:\s*(.+)/)
    if (!signatureMatch) {
      log('No se pudo obtener la firma', 'error')
      rl.close()
      process.exit(1)
    }

    const signature = signatureMatch[1].trim()
    log('Instalador firmado exitosamente', 'success')

    // 6. Obtener release notes
    console.log('\n📝 Ingresa las notas de versión (una por línea, línea vacía para terminar):')
    const notes = []
    while (true) {
      const note = await question('  • ')
      if (!note.trim()) break
      notes.push(note.trim())
    }

    if (notes.length === 0) {
      log('Debes agregar al menos una nota', 'error')
      rl.close()
      process.exit(1)
    }

    const releaseNotes = notes.map(n => `• ${n}`).join('\n')

    // 7. Obtener nombre de usuario de GitHub
    let githubUser
    try {
      githubUser = exec('gh api user --jq .login', true).trim()
    } catch {
      log('No se pudo obtener usuario de GitHub', 'error')
      log('Asegúrate de estar autenticado con: gh auth login', 'warning')
      rl.close()
      process.exit(1)
    }

    // 8. Crear manifests JSON para cada plataforma
    log('Creando manifests...', 'info')

    const manifests = {
      'windows-x86_64': {
        version,
        notes: releaseNotes,
        pub_date: new Date().toISOString(),
        platforms: {
          'windows-x86_64': {
            signature,
            url: `https://github.com/${githubUser}/devnest-pos-desktop/releases/download/v${version}/${path.basename(fileToSign)}`,
          },
        },
      },
    }

    // Guardar manifests
    const manifestDir = path.join(__dirname, '..', 'release-manifests')
    if (!fs.existsSync(manifestDir)) {
      fs.mkdirSync(manifestDir, { recursive: true })
    }

    Object.keys(manifests).forEach(platform => {
      const manifestPath = path.join(manifestDir, `${platform}.json`)
      fs.writeFileSync(manifestPath, JSON.stringify(manifests[platform], null, 2))
      log(`Manifest creado: ${platform}.json`, 'success')
    })

    // 9. Confirmar publicación
    console.log('\n' + '='.repeat(60))
    console.log('📋 Resumen del Release:')
    console.log('='.repeat(60))
    console.log(`Versión: v${version}`)
    console.log(`Instalador: ${path.basename(fileToSign)}`)
    console.log(`Tamaño: ${(fs.statSync(fileToSign).size / 1024 / 1024).toFixed(2)} MB`)
    console.log(`Notas:\n${releaseNotes}`)
    console.log('='.repeat(60) + '\n')

    const confirm = await question('¿Publicar en GitHub? (s/n): ')
    if (confirm.toLowerCase() !== 's') {
      log('Publicación cancelada', 'warning')
      rl.close()
      process.exit(0)
    }

    // 10. Crear release en GitHub
    log('Publicando en GitHub...', 'info')

    const releaseCmd = [
      'gh release create',
      `v${version}`,
      `--title "DevNest POS v${version}"`,
      `--notes "${releaseNotes}"`,
      `"${fileToSign}"`,
      path.join(manifestDir, 'windows-x86_64.json'),
    ].join(' ')

    exec(releaseCmd)

    // 11. Resumen final
    console.log('\n' + '='.repeat(60))
    log('✅ Release publicado exitosamente!', 'success')
    console.log('='.repeat(60))
    console.log(`\n🔗 URL: https://github.com/${githubUser}/devnest-pos-desktop/releases/tag/v${version}`)
    console.log(`\n📦 Los usuarios recibirán actualización automática a v${version}`)
    console.log('')

    rl.close()
  } catch (error) {
    log(`Error: ${error.message}`, 'error')
    rl.close()
    process.exit(1)
  }
}

// Manejo de Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Operación cancelada\n')
  rl.close()
  process.exit(0)
})

main()
