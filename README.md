# 🚀 DevNest POS Desktop

Aplicación de escritorio multiplataforma para gestionar el sistema DevNest POS. Instalador profesional con actualizaciones automáticas.

## ✨ Características

- ✅ **Multiplataforma** - Windows, macOS, Linux
- ✅ **Instaladores nativos** - MSI, EXE, DMG, AppImage
- ✅ **Actualizaciones automáticas** - Desde tu servidor o GitHub
- ✅ **Interfaz moderna** - React + Tailwind CSS
- ✅ **Tamaño pequeño** - 10-15MB (vs 150MB de Electron)
- ✅ **Rápido** - Usa WebView del sistema
- ✅ **Seguro** - Firmas criptográficas

## 📦 Lo que hace

Esta app:
1. **Instala** el POS en la máquina del usuario
2. **Inicia** el servidor Node.js del POS
3. **Abre** el navegador en http://localhost:3000
4. **Verifica** actualizaciones automáticamente
5. **Descarga e instala** nuevas versiones

## 🔧 Prerequisitos (para desarrollar)

### 1. Instalar Rust (5 minutos)

```bash
# Windows (PowerShell como administrador)
winget install --id Rustlang.Rustup

# O descarga desde: https://rustup.rs/

# Verifica instalación
rustc --version
```

### 2. Instalar Node.js 18+

Ya lo tienes instalado ✅

---

## 🚀 Quick Start (Desarrollo)

```bash
# 1. Instalar dependencias
cd devnest-pos-desktop
npm install

# 2. Iniciar en modo desarrollo
npm run tauri:dev

# La app se abrirá automáticamente
```

---

## 🏗️ Compilar para Producción

### Windows:

```bash
# Build
npm run tauri build

# Instaladores generados en:
# src-tauri/target/release/bundle/msi/DevNest-POS_1.0.0_x64_es-ES.msi
# src-tauri/target/release/bundle/nsis/DevNest-POS_1.0.0_x64-setup.exe
```

### macOS:

```bash
npm run tauri build

# Generado en:
# src-tauri/target/release/bundle/dmg/DevNest-POS_1.0.0_x64.dmg
# src-tauri/target/release/bundle/macos/DevNest-POS.app
```

### Linux:

```bash
npm run tauri build

# Generado en:
# src-tauri/target/release/bundle/appimage/DevNest-POS_1.0.0_amd64.AppImage
# src-tauri/target/release/bundle/deb/devnest-pos_1.0.0_amd64.deb
```

---

## 📦 Incluir el POS en el instalador

Para que el instalador incluya el POS:

```bash
# 1. Build del POS
cd ../devnest-pos
npm run build

# 2. Copiar build a la carpeta de recursos
mkdir -p ../devnest-pos-desktop/src-tauri/resources/pos
cp -r .next package.json public ../devnest-pos-desktop/src-tauri/resources/pos/

# 3. Build del instalador
cd ../devnest-pos-desktop
npm run tauri build
```

El instalador incluirá el POS completo.

---

## 🔄 Configurar Actualizaciones Automáticas

Lee `BACKEND-SETUP.md` para configurar el backend de actualizaciones.

**Opciones:**
1. **GitHub Releases** (Recomendado - Gratis)
2. **Tu servidor** (Control total)
3. **Hosting estático** (Vercel/Netlify)

---

## 📊 Tamaños de instaladores

| Plataforma | Tamaño | Formato |
|------------|--------|---------|
| **Windows** | 12-15 MB | MSI / NSIS |
| **macOS** | 15-18 MB | DMG |
| **Linux** | 14-16 MB | AppImage / DEB |

---

## 🎨 Personalizar la app

### Cambiar nombre/versión:

Edita `src-tauri/tauri.conf.json`:
```json
{
  "productName": "Mi POS",
  "version": "1.0.0",
  "identifier": "com.miempresa.pos"
}
```

### Cambiar ícono:

Reemplaza los archivos en `src-tauri/icons/`:
- `icon.ico` - Windows
- `icon.icns` - macOS
- `icon.png` - Linux

### Cambiar UI:

Edita `src/App.tsx` - Es React normal con Tailwind CSS

---

## 🔐 Firmar actualizaciones

Para que las actualizaciones funcionen:

```bash
# 1. Generar claves
npm run tauri signer generate -- -w ~/.tauri/devnest.key

# 2. Copiar clave pública a tauri.conf.json
# (se muestra en consola)

# 3. Firmar instaladores antes de publicar
npm run tauri signer sign src-tauri/target/release/bundle/msi/*.msi
```

---

## 📁 Estructura del proyecto

```
devnest-pos-desktop/
├── src/                          # Frontend React
│   ├── App.tsx                   # UI principal
│   ├── main.tsx                  # Entry point
│   └── index.css                 # Tailwind
├── src-tauri/                    # Backend Rust
│   ├── src/
│   │   └── main.rs              # Lógica principal (50 líneas)
│   ├── tauri.conf.json          # Configuración
│   └── Cargo.toml               # Dependencias Rust
├── update-server/               # Servidor de actualizaciones opcional
│   ├── server.js
│   └── updates/                # Manifests y releases
├── package.json
└── vite.config.ts
```

---

## 🐞 Troubleshooting

### "error: could not find `Cargo.toml`"
```bash
# Instala Rust
winget install Rustlang.Rustup
# Reinicia la terminal
```

### "Error de firma en actualizaciones"
```bash
# Genera nuevo par de claves
npm run tauri signer generate -- -w ~/.tauri/devnest.key
# Actualiza pubkey en tauri.conf.json
```

### "POS no inicia"
Verifica que el POS esté en `src-tauri/resources/pos/` después del build.

### Instalador no ejecuta en Windows
Probablemente Windows Defender lo bloquea. Solución:
1. Firmar el ejecutable con certificado de código
2. O agregar excepción en Windows Defender

---

## 🎯 Workflow de Release

```bash
# 1. Actualizar versión
# Edita version en package.json y src-tauri/tauri.conf.json

# 2. Build
npm run tauri build

# 3. Firmar
npm run tauri signer sign src-tauri/target/release/bundle/msi/*.msi

# 4. Publicar en GitHub Releases
gh release create v1.0.0 \
  --title "DevNest POS v1.0.0" \
  --notes "Release notes aquí" \
  src-tauri/target/release/bundle/msi/*.msi \
  src-tauri/target/release/bundle/dmg/*.dmg

# 5. Usuarios reciben actualización automática
```

---

## 📚 Recursos

- [Documentación Tauri](https://v2.tauri.app/)
- [API de Tauri](https://v2.tauri.app/reference/javascript/api/)
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

---

## 🆘 Soporte

1. Lee `BACKEND-SETUP.md` para configurar actualizaciones
2. Verifica logs en la consola de desarrollo
3. Revisa Issues en el repositorio

---

## 📝 Notas importantes

- ✅ **Solo TÚ necesitas Rust** instalado (para compilar)
- ✅ **Usuarios finales NO necesitan nada** (solo descargan .exe/.dmg)
- ✅ **El instalador incluye todo** (POS + Node.js portable)
- ✅ **Multi-plataforma real** (mismo código para Windows/Mac/Linux)

---

## 🎉 ¡Listo!

```bash
# Desarrollo
npm run tauri:dev

# Producción
npm run tauri build
```

Los instaladores estarán en `src-tauri/target/release/bundle/`

**Próximo paso:** Configura el backend de actualizaciones en `BACKEND-SETUP.md`
