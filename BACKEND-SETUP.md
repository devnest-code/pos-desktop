# 🔧 Configuración del Backend - DevNest POS Desktop

## 🎯 Qué necesitas tener corriendo

Para que las actualizaciones automáticas funcionen, necesitas **UN servidor** que sirva los archivos de actualización.

---

## 📊 Opciones de Backend (elige una)

### Opción 1: **GitHub Releases** (Recomendado - Gratis)

✅ Gratis
✅ CDN global rápido
✅ Sin configuración de servidor
✅ SSL incluido
✅ Tauri tiene soporte nativo

#### Cómo configurar:

1. **Crear repositorio en GitHub:**
```bash
gh repo create devnest-pos-desktop --private
```

2. **Generar par de claves para firma:**
```bash
# Instalar herramienta
npm install -g @tauri-apps/cli

# Generar claves
npm run tauri signer generate -- -w ~/.tauri/myapp.key

# Esto genera:
# - Clave privada: ~/.tauri/myapp.key
# - Clave pública: (se muestra en consola)
```

3. **Actualizar `tauri.conf.json`:**
```json
{
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://github.com/tu-usuario/devnest-pos-desktop/releases/latest/download/latest.json"
      ],
      "pubkey": "TU_CLAVE_PUBLICA_AQUI"
    }
  }
}
```

4. **Publicar nueva versión:**
```bash
# Build
npm run tauri build

# Los instaladores están en:
# src-tauri/target/release/bundle/

# Crear release en GitHub
gh release create v1.0.0 \
  --title "DevNest POS v1.0.0" \
  --notes "Primera versión estable" \
  src-tauri/target/release/bundle/msi/*.msi \
  src-tauri/target/release/bundle/nsis/*.exe

# Tauri automáticamente buscará actualizaciones en GitHub Releases
```

✅ **Listo!** No necesitas servidor propio.

---

### Opción 2: **Tu Propio Servidor** (Control total)

Si prefieres tu propio servidor, aquí está el setup simple.

#### Estructura que necesitas:

```
https://tudominio.com/updates/
├── windows-x86_64.json
├── darwin-x86_64.json      (Mac Intel)
├── darwin-aarch64.json     (Mac M1/M2)
├── linux-x86_64.json
└── releases/
    ├── DevNest-POS-1.0.0.msi
    ├── DevNest-POS-1.0.0.exe
    ├── DevNest-POS-1.0.0.dmg
    └── DevNest-POS-1.0.0.AppImage
```

#### Archivo JSON (ejemplo `windows-x86_64.json`):

```json
{
  "version": "1.1.0",
  "notes": "• Corrección de bugs\n• Mejoras de rendimiento",
  "pub_date": "2024-02-12T10:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "FIRMA_AQUI",
      "url": "https://tudominio.com/updates/releases/DevNest-POS-1.1.0.msi"
    }
  }
}
```

#### Servidor simple con Node.js:

Ya está creado en `update-server/server.js`

**Iniciar servidor:**
```bash
cd update-server
node server.js

# Servidor en: http://localhost:3002
# Dashboard: http://localhost:3002/dashboard
```

**Configurar en `tauri.conf.json`:**
```json
{
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://tudominio.com/updates/{{target}}-{{arch}}.json"
      ],
      "pubkey": "TU_CLAVE_PUBLICA"
    }
  }
}
```

**Publicar nueva versión:**

1. Build la nueva versión:
```bash
npm run tauri build
```

2. Copiar archivos a servidor:
```bash
# Copiar instaladores
cp src-tauri/target/release/bundle/msi/*.msi update-server/updates/releases/
cp src-tauri/target/release/bundle/nsis/*.exe update-server/updates/releases/

# Actualizar manifest (ejemplo Windows)
cat > update-server/updates/windows-x86_64.json << EOF
{
  "version": "1.1.0",
  "notes": "• Nueva funcionalidad X\n• Corrección de bugs",
  "pub_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "platforms": {
    "windows-x86_64": {
      "signature": "FIRMA_AQUI",
      "url": "https://tudominio.com/updates/releases/DevNest-POS-1.1.0.msi"
    }
  }
}
EOF
```

3. Subir a tu servidor (FTP, rsync, etc.)

---

### Opción 3: **Hosting estático** (Vercel, Netlify, Cloudflare Pages)

También puedes usar hosting estático gratis:

1. Sube la carpeta `update-server/updates/` a Vercel/Netlify
2. Configura el dominio custom
3. Actualiza `tauri.conf.json` con la URL

✅ Gratis
✅ CDN global
✅ SSL automático

---

## 🔐 Firmar actualizaciones (Importante)

Para que las actualizaciones funcionen, necesitas firmarlas:

### 1. Generar claves:
```bash
npm run tauri signer generate -- -w ~/.tauri/devnest.key
```

Esto genera:
- **Clave privada**: `~/.tauri/devnest.key` (NO COMPARTIR)
- **Clave pública**: Se muestra en consola (va en `tauri.conf.json`)

### 2. Firmar instaladores:
```bash
npm run tauri signer sign src-tauri/target/release/bundle/msi/DevNest-POS_1.1.0_x64_en-US.msi

# Output: signature string
```

### 3. Poner firma en manifest JSON:
```json
{
  "platforms": {
    "windows-x86_64": {
      "signature": "LA_FIRMA_GENERADA_AQUI",
      "url": "..."
    }
  }
}
```

---

## 📋 Resumen de lo que necesitas

### Para desarrollo:
- ✅ Nada, todo funciona localmente

### Para producción (usuarios finales):
- ✅ Un servidor que sirva:
  - Archivos JSON (manifests)
  - Instaladores (.msi, .exe, .dmg, .AppImage)
- ✅ Par de claves para firmar
- ✅ Dominio con SSL (recomendado)

### Recomendación:
**Usa GitHub Releases** (más fácil, gratis, profesional)

---

## 🚀 Workflow completo

```
1. Desarrollas nueva versión
   ↓
2. npm run tauri build
   ↓
3. Firmas los instaladores
   ↓
4. Publicas en GitHub Releases (o tu servidor)
   ↓
5. Usuarios abren la app
   ↓
6. App detecta actualización automáticamente
   ↓
7. Usuario hace clic "Actualizar"
   ↓
8. Descarga e instala en segundo plano
   ↓
9. Reinicia con nueva versión
```

---

## ❓ Preguntas frecuentes

**¿Puedo usar sin backend?**
No, necesitas al menos GitHub Releases gratis.

**¿Funciona offline?**
La app sí funciona offline, pero no puede verificar actualizaciones.

**¿Cuánto tráfico necesito?**
Depende de usuarios. Cada actualización descarga ~15-20MB por usuario.

**¿Puedo usar mi propio dominio?**
Sí, solo configura el endpoint en `tauri.conf.json`

---

**Próximo paso:** Lee `README.md` para compilar tu primera versión.

