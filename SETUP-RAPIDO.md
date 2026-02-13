# ⚡ Setup Rápido - Paso a Paso

## 🎯 Lo que vamos a hacer

1. ✅ Instalar Rust (5 min)
2. ✅ Instalar dependencias del proyecto (2 min)
3. ✅ Probar en desarrollo (2 min)
4. ✅ Compilar primer instalador (5 min)
5. ✅ Configurar actualizaciones (10 min)

**Total: ~25 minutos**

---

## Paso 1: Instalar Rust

```powershell
# Abre PowerShell como ADMINISTRADOR

# Instalar Rust
winget install --id Rustlang.Rustup

# O descarga desde: https://rustup.rs/
```

**IMPORTANTE:** Después de instalar:
1. Cierra PowerShell
2. Abre nueva terminal
3. Verifica: `rustc --version`

---

## Paso 2: Instalar dependencias

```bash
cd C:\xampp82\htdocs\devnest\devnest-pos-desktop

# Instalar dependencias de Node
npm install
```

Esto instala:
- Tauri CLI
- React + Vite
- Tailwind CSS
- Lucide icons

**Tiempo:** ~2 minutos

---

## Paso 3: Probar en desarrollo

```bash
# Iniciar en modo desarrollo
npm run tauri:dev
```

**Qué esperar:**
1. Compilación de Rust (primera vez toma ~5 min)
2. Se abre una ventana con la app
3. Verás la interfaz del gestor del POS

**Si ves la ventana:** ✅ Todo funciona

**Si hay errores:**
- Verifica que Rust esté instalado: `rustc --version`
- Reinicia la terminal

---

## Paso 4: Compilar primer instalador

```bash
# Build para producción (Windows)
npm run tauri build
```

**Qué esperar:**
1. Compilación optimizada (toma ~10-15 min la primera vez)
2. Instaladores generados en:
   ```
   src-tauri/target/release/bundle/
   ├── msi/
   │   └── DevNest-POS_1.0.0_x64_es-ES.msi    (~12 MB)
   └── nsis/
       └── DevNest-POS_1.0.0_x64-setup.exe    (~13 MB)
   ```

**Prueba el instalador:**
1. Ve a la carpeta `msi/`
2. Doble clic en el `.msi`
3. Instala la app
4. Abre desde menú inicio
5. ✅ ¡Funciona!

---

## Paso 5: Configurar actualizaciones (GitHub)

### 5.1. Generar claves de firma

```bash
npm run tauri signer generate -- -w C:/Users/yojea/.tauri/devnest.key
```

**Salida:**
```
Your keypair was generated successfully
Private: C:/Users/yojea/.tauri/devnest.key
Public: dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6...
```

**IMPORTANTE:** Copia la clave pública (todo el texto largo)

### 5.2. Actualizar tauri.conf.json

Edita `src-tauri/tauri.conf.json`:

```json
{
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://github.com/TU-USUARIO/devnest-pos-desktop/releases/latest/download/latest.json"
      ],
      "pubkey": "PEGA_AQUI_TU_CLAVE_PUBLICA",
      "dialog": false
    }
  }
}
```

### 5.3. Crear repositorio en GitHub

```bash
# Desde la carpeta del proyecto
git init
git add .
git commit -m "Initial commit"

# Crear repo en GitHub
gh repo create devnest-pos-desktop --private --source=. --push

# O manualmente:
# 1. Ve a github.com/new
# 2. Nombre: devnest-pos-desktop
# 3. Privado
# 4. Crear
# 5. Sigue instrucciones para push
```

### 5.4. Publicar primera release

```bash
# Firmar instalador
npm run tauri signer sign src-tauri/target/release/bundle/msi/DevNest-POS_1.0.0_x64_es-ES.msi

# Copiar la firma que se muestra

# Crear manifest JSON
cat > latest.json << 'EOF'
{
  "version": "1.0.0",
  "notes": "Primera versión estable",
  "pub_date": "2024-02-12T10:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "PEGA_AQUI_LA_FIRMA",
      "url": "https://github.com/TU-USUARIO/devnest-pos-desktop/releases/download/v1.0.0/DevNest-POS_1.0.0_x64_es-ES.msi"
    }
  }
}
EOF

# Crear release en GitHub
gh release create v1.0.0 \
  --title "DevNest POS v1.0.0" \
  --notes "Primera versión estable del instalador" \
  src-tauri/target/release/bundle/msi/DevNest-POS_1.0.0_x64_es-ES.msi \
  latest.json
```

### 5.5. Verificar que funciona

1. Abre la app instalada
2. Espera unos segundos
3. Si hay actualización, aparecerá un banner azul
4. Clic en "Actualizar Ahora"
5. Se descarga e instala automáticamente
6. ✅ Listo!

---

## ✅ Checklist de Verificación

- [ ] Rust instalado y funcionando (`rustc --version`)
- [ ] Dependencias npm instaladas
- [ ] App funciona en desarrollo (`npm run tauri:dev`)
- [ ] Instalador compilado exitosamente
- [ ] Instalador probado y funciona
- [ ] Par de claves generado
- [ ] Clave pública en `tauri.conf.json`
- [ ] Repositorio GitHub creado
- [ ] Primera release publicada
- [ ] Actualizaciones automáticas funcionando

---

## 🎯 Próximos pasos

### Para distribuir a usuarios:

1. **Sube instalador a tu sitio web:**
   ```
   https://tudominio.com/descargas/DevNest-POS-Setup.msi
   ```

2. **Usuarios descargan e instalan**

3. **Reciben actualizaciones automáticas desde GitHub**

### Para actualizar a v1.1.0:

```bash
# 1. Actualiza versión en package.json y src-tauri/tauri.conf.json

# 2. Build
npm run tauri build

# 3. Firma
npm run tauri signer sign src-tauri/target/release/bundle/msi/*.msi

# 4. Actualiza latest.json con nueva versión y firma

# 5. Publica release
gh release create v1.1.0 \
  --title "DevNest POS v1.1.0" \
  --notes "• Nueva funcionalidad X\n• Corrección de bugs" \
  src-tauri/target/release/bundle/msi/*.msi \
  latest.json

# 6. Usuarios reciben notificación automática
```

---

## 🆘 Si algo falla

### Error: "could not find Cargo.toml"
```bash
rustc --version  # Verifica que Rust esté instalado
# Reinicia la terminal
```

### Error: "tauri: command not found"
```bash
npm install  # Reinstala dependencias
```

### Build falla en Windows
```bash
# Asegúrate de tener Visual Studio Build Tools
# Descarga: https://visualstudio.microsoft.com/downloads/
# Instala "Desktop development with C++"
```

### Actualización no aparece
- Verifica que `latest.json` esté en el release de GitHub
- Verifica que la versión en `latest.json` sea mayor
- Verifica que la firma sea correcta

---

## 📊 Resumen de lo creado

✅ **Aplicación de escritorio** (Windows/Mac/Linux)
✅ **Instalador profesional** (~12 MB)
✅ **Actualizaciones automáticas** (desde GitHub gratis)
✅ **Interfaz moderna** (React + Tailwind)
✅ **Sin dependencias** para usuarios finales

---

## 🎉 ¡Listo!

Ahora tienes un instalador profesional que:
- Se distribuye fácilmente
- Se actualiza automáticamente
- Funciona en cualquier Windows/Mac/Linux
- Pesa solo 12-15 MB
- No requiere configuración del usuario

**Siguiente paso:** Ejecuta `npm run tauri:dev` para ver la app funcionando.
