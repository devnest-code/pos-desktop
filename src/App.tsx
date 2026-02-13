import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'
import {
  Play,
  Square,
  RefreshCw,
  Settings,
  ExternalLink,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react'

type POSStatus = 'stopped' | 'starting' | 'running' | 'error'

interface UpdateInfo {
  available: boolean
  currentVersion: string
  latestVersion?: string
  body?: string
}

function App() {
  const [posStatus, setPosStatus] = useState<POSStatus>('stopped')
  const [posUrl, setPosUrl] = useState('http://localhost:3000')
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>({
    available: false,
    currentVersion: '1.0.0'
  })
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  // Verificar actualizaciones al iniciar
  useEffect(() => {
    checkForUpdates()
  }, [])

  // Iniciar POS
  const handleStartPOS = async () => {
    try {
      setPosStatus('starting')
      await invoke('start_pos_server')
      setPosStatus('running')
    } catch (error) {
      console.error('Error starting POS:', error)
      setPosStatus('error')
    }
  }

  // Detener POS
  const handleStopPOS = async () => {
    try {
      await invoke('stop_pos_server')
      setPosStatus('stopped')
    } catch (error) {
      console.error('Error stopping POS:', error)
    }
  }

  // Abrir en navegador
  const handleOpenBrowser = () => {
    window.open(posUrl, '_blank')
  }

  // Verificar actualizaciones
  const checkForUpdates = async () => {
    try {
      setIsCheckingUpdate(true)
      const update = await check()

      if (update) {
        setUpdateInfo({
          available: true,
          currentVersion: update.currentVersion,
          latestVersion: update.version,
          body: update.body
        })
      } else {
        setUpdateInfo({
          available: false,
          currentVersion: '1.0.0'
        })
      }
    } catch (error) {
      console.error('Error checking updates:', error)
    } finally {
      setIsCheckingUpdate(false)
    }
  }

  // Instalar actualización
  const handleInstallUpdate = async () => {
    if (!updateInfo.available) return

    try {
      setIsInstalling(true)
      const update = await check()

      if (update) {
        // Descargar e instalar
        await update.downloadAndInstall()

        // Reiniciar la aplicación
        await relaunch()
      }
    } catch (error) {
      console.error('Error installing update:', error)
      setIsInstalling(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="flex items-center justify-between p-6 border-b border-slate-700/50 bg-slate-900/50 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-xl font-bold">
            DN
          </div>
          <div>
            <h1 className="text-xl font-bold">DevNest POS</h1>
            <p className="text-xs text-slate-400">Sistema de Punto de Venta</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={checkForUpdates}
            disabled={isCheckingUpdate}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
            title="Buscar actualizaciones"
          >
            <RefreshCw className={`w-5 h-5 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
          </button>
          <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors" title="Configuración">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-2xl space-y-6">

          {/* Status Card */}
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">Estado del Sistema</h2>
                <p className="text-slate-400 text-sm">Versión {updateInfo.currentVersion}</p>
              </div>

              <div className="flex items-center gap-2">
                {posStatus === 'stopped' && (
                  <span className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 rounded-lg text-sm">
                    <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                    Detenido
                  </span>
                )}
                {posStatus === 'starting' && (
                  <span className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-sm text-yellow-400">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Iniciando...
                  </span>
                )}
                {posStatus === 'running' && (
                  <span className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-lg text-sm text-green-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    En línea
                  </span>
                )}
                {posStatus === 'error' && (
                  <span className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded-lg text-sm text-red-400">
                    <AlertCircle className="w-3 h-3" />
                    Error
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-4">
              {posStatus === 'stopped' || posStatus === 'error' ? (
                <button
                  onClick={handleStartPOS}
                  disabled={posStatus === 'starting'}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-6 py-4 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="w-5 h-5" />
                  Iniciar POS
                </button>
              ) : (
                <button
                  onClick={handleStopPOS}
                  className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 px-6 py-4 rounded-xl font-semibold transition-colors"
                >
                  <Square className="w-5 h-5" />
                  Detener POS
                </button>
              )}

              <button
                onClick={handleOpenBrowser}
                disabled={posStatus !== 'running'}
                className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 px-6 py-4 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ExternalLink className="w-5 h-5" />
                Abrir en Navegador
              </button>
            </div>

            {/* URL */}
            {posStatus === 'running' && (
              <div className="mt-4 p-4 bg-slate-900/50 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">URL del POS:</p>
                <code className="text-sm text-blue-400">{posUrl}</code>
              </div>
            )}
          </div>

          {/* Update Card */}
          {updateInfo.available && (
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur border border-blue-500/30 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Download className="w-6 h-6 text-blue-400" />
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-1">Actualización Disponible</h3>
                  <p className="text-sm text-slate-300 mb-3">
                    Versión {updateInfo.latestVersion} está lista para instalar
                  </p>

                  {updateInfo.body && (
                    <div className="bg-slate-900/50 rounded-lg p-3 mb-4">
                      <p className="text-xs text-slate-400 mb-2">Novedades:</p>
                      <p className="text-sm text-slate-200 whitespace-pre-line">{updateInfo.body}</p>
                    </div>
                  )}

                  <button
                    onClick={handleInstallUpdate}
                    disabled={isInstalling}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
                  >
                    {isInstalling ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Instalando...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Actualizar Ahora
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="flex items-center justify-center gap-6 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Sistema instalado
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Actualizaciones automáticas
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 border-t border-slate-700/50 bg-slate-900/50 backdrop-blur text-center text-xs text-slate-500">
        DevNest POS Desktop v{updateInfo.currentVersion} • Powered by Tauri
      </footer>
    </div>
  )
}

export default App
