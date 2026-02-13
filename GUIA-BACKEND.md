# 🚀 Guía Completa de Backend - GitHub Releases

## 🎯 Resumen

**Backend = GitHub Releases** (no necesitas servidor propio)

GitHub Releases sirve como:
- ✅ Servidor de archivos (almacena los .exe/.msi)
- ✅ API de actualizaciones (Tauri lee automáticamente)
- ✅ CDN global (rápido en todo el mundo)
- ✅ Gratis (para repos públicos y privados)

---

## 📋 Setup Inicial (una sola vez)

### Paso 1: Instalar GitHub CLI

```bash
# Windows
winget install --id GitHub.cli

# Verificar
gh --version

# Login
gh auth login
# Selecciona: GitHub.com → HTTPS → Yes → Login with browser
```

### Paso 2: Crear Repositorio

```bash
cd C:\xampp82\htdocs\devnest\devnest-pos-desktop

# Inicializar git
git init
git add .
git commit -m "Initial commit"

# Crear repo privado en GitHub
gh repo create devnest-pos-desktop --private --source=. --push

# Listo! Repo creado en:
# https://github.com/TU-USUARIO/devnest-pos-desktop
```

### Paso 3: Generar Claves de Firma

```bash
# Generar par de claves
npm run tauri signer generate -- -w C:/Users/yojea/.tauri/devnest.key

# Output:
# Your keypair was generated successfully
# Private: C:/Users/yojea/.tauri/devnest.key
# Public: dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IEFCQ0RFRkc...
```

**IMPORTANTE:**
- ✅ Guarda la **clave privada** (.tauri/devnest.key) - NO SUBIR A GIT
- ✅ Copia la **clave pública** (toda la línea larga)

### Paso 4: Configurar tauri.conf.json

Edita `src-tauri/tauri.conf.json`:

```json
{
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://github.com/TU-USUARIO/devnest-pos-desktop/releases/latest/download/{{target}}-{{arch}}.json"
      ],
      "dialog": false,
      "pubkey": "PEGA_AQUI_TU_CLAVE_PUBLICA_COMPLETA"
    }
  }
}
```

**Reemplaza:**
- `TU-USUARIO` → Tu usuario de GitHub (ej: `yojea`)
- `PEGA_AQUI_TU_CLAVE_PUBLICA_COMPLETA` → La clave pública del paso 3

**Guarda el archivo** y haz commit:

```bash
git add src-tauri/tauri.conf.json
git commit -m "Configure GitHub Releases updater"
git push
```

---

## 🔄 Publicar Nueva Versión

### Opción A: Script Automático (Recomendado)

```bash
# 1. Asegúrate de tener el build
npm run tauri build

# 2. Publica con el script
node scripts/publish-release.js 1.0.0

# El script hace TODO automáticamente:
# - Firma el instalador
# - Crea manifests JSON
# - Publica en GitHub
# - ¡Listo!
```

### Opción B: Manual (si prefieres control total)

```bash
# 1. Build
npm run tauri build

# 2. Firmar instalador
npm run tauri signer sign src-tauri/target/release/bundle/msi/*.msi -- -k C:/Users/yojea/.tauri/devnest.key

# Copia la firma que se muestra

# 3. Crear manifest JSON
cat > windows-x86_64.json << 'EOF'
{
  "version": "1.0.0",
  "notes": "• Primera versión estable\n• Sistema completo de POS",
  "pub_date": "2024-02-12T10:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "PEGA_AQUI_LA_FIRMA",
      "url": "https://github.com/TU-USUARIO/devnest-pos-desktop/releases/download/v1.0.0/DevNest-POS_1.0.0_x64_es-ES.msi"
    }
  }
}
EOF

# 4. Publicar en GitHub
gh release create v1.0.0 \
  --title "DevNest POS v1.0.0" \
  --notes "• Primera versión estable
• Sistema completo de POS
• Actualizaciones automáticas" \
  src-tauri/target/release/bundle/msi/*.msi \
  windows-x86_64.json

# ¡Publicado!
```

---

## 📦 Estructura en GitHub Releases

Después de publicar, GitHub tendrá:

```
https://github.com/tu-usuario/devnest-pos-desktop/releases/
└── v1.0.0
    ├── DevNest-POS_1.0.0_x64_es-ES.msi          (Instalador)
    └── windows-x86_64.json                       (Manifest)
```

**La app lee automáticamente el JSON para verificar actualizaciones.**

---

## 🔄 Workflow Completo

### Para desarrollo (v1.0.0 → v1.1.0):

```bash
# 1. Desarrollar cambios en devnest-pos/
cd ../devnest-pos
# ... haces cambios ...
git commit -m "feat: nueva funcionalidad X"
git push

# 2. Actualizar versión en desktop
cd ../devnest-pos-desktop

# Edita package.json:
"version": "1.1.0"

# Edita src-tauri/tauri.conf.json:
"version": "1.1.0"

git commit -m "chore: bump version to 1.1.0"
git push

# 3. Build
npm run tauri build

# 4. Publicar
node scripts/publish-release.js 1.1.0
# Ingresa release notes cuando te pida

# 5. ¡Listo!
# Los usuarios reciben notificación automática
```

---

## 👥 Para Usuarios Finales

### Primera instalación:

1. Van a: `https://github.com/tu-usuario/devnest-pos-desktop/releases/latest`
2. Descargan: `DevNest-POS_X.X.X_x64_es-ES.msi`
3. Doble clic → Instalar
4. Abrir app desde menú inicio

### Actualizaciones:

1. Abren la app normalmente
2. Si hay actualización, ven banner azul:
   ```
   🎉 Nueva versión disponible
   v1.1.0 está lista
   [Actualizar Ahora]
   ```
3. Click "Actualizar Ahora"
4. Descarga e instala automáticamente
5. App reinicia con nueva versión
6. ✅ ¡Actualizado!

---

## 🌐 Distribuir a Usuarios

### Opción 1: Link directo a última versión

```
https://github.com/tu-usuario/devnest-pos-desktop/releases/latest
```

Pones este link en tu sitio web, usuarios descargan la última versión siempre.

### Opción 2: Tu propio sitio web

Crea una página simple:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Descargar DevNest POS</title>
</head>
<body>
  <h1>DevNest POS</h1>
  <a href="https://github.com/tu-usuario/devnest-pos-desktop/releases/latest/download/DevNest-POS_1.0.0_x64_es-ES.msi">
    Descargar para Windows
  </a>
</body>
</html>
```

### Opción 3: Releases públicos

Si haces el repo público, cualquiera puede descargar desde GitHub directamente.

---

## 💰 Costos

| Concepto | Costo |
|----------|-------|
| **GitHub Releases** | Gratis |
| **Almacenamiento** | Gratis (hasta 2 GB por release) |
| **Ancho de banda** | Gratis (ilimitado) |
| **CDN global** | Gratis |
| **Total** | **$0 / mes** |

---

## ❓ Preguntas Frecuentes

### ¿Necesito un servidor?
No. GitHub Releases ES el servidor.

### ¿Funciona con repos privados?
Sí, pero los instaladores deben ser públicos. Usa un repo público solo para releases.

### ¿Cuántos usuarios soporta?
Ilimitados. GitHub tiene CDN global.

### ¿Qué pasa si GitHub cae?
Muy raro. Pero las apps instaladas siguen funcionando, solo no pueden verificar actualizaciones.

### ¿Puedo usar mi dominio?
Sí, pero necesitarías tu servidor. GitHub Releases es más simple.

### ¿Cómo hago rollback?
```bash
# Editar el manifest JSON en el release
# Cambiar version a anterior
# O crear nuevo release con versión anterior
```

---

## 🔒 Seguridad

### La clave privada es CRÍTICA:

- ✅ **Guardarla** en `C:/Users/yojea/.tauri/devnest.key`
- ❌ **NO subir a Git** (ya está en .gitignore)
- ❌ **NO compartir** con nadie
- ✅ **Hacer backup** en lugar seguro

**Si pierdes la clave:** Tendrás que generar una nueva y todos los usuarios tendrán que reinstalar.

---

## ✅ Checklist Final

- [ ] GitHub CLI instalado y autenticado
- [ ] Repositorio creado en GitHub
- [ ] Par de claves generado
- [ ] Clave pública en `tauri.conf.json`
- [ ] Usuario de GitHub en `tauri.conf.json`
- [ ] Primera versión compilada
- [ ] Primera release publicada
- [ ] Instalador probado
- [ ] Actualización automática probada

---

## 🎯 Próximo Paso

Ejecuta:

```bash
cd C:\xampp82\htdocs\devnest\devnest-pos-desktop

# Si aún no has instalado Rust:
winget install Rustlang.Rustup

# Instalar dependencias
npm install

# Probar en desarrollo
npm run tauri:dev

# Build primera versión
npm run tauri build

# Publicar
node scripts/publish-release.js 1.0.0
```

¡Y listo! Tu backend está configurado. 🚀
