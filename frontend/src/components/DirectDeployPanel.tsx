import { useState, useEffect, useCallback } from 'react';
import { Loader2, Rocket, Eye, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface DirectDeployPanelProps {
  landingId: string;
  landingName: string;
  route: string;
}

interface DeployResult {
  success: boolean;
  message: string;
  previewUrl?: string;
  logs?: string[];
  error?: string;
  status?: 'pending' | 'cloning' | 'publishing' | 'installing' | 'waiting' | 'deploying' | 'completed' | 'error';
  currentStep?: string;
  waitTimeRemaining?: number;
}

export function DirectDeployPanel({ landingId, landingName }: DirectDeployPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [result, setResult] = useState<DeployResult | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [deployStatus, setDeployStatus] = useState<'pending' | 'cloning' | 'publishing' | 'installing' | 'waiting' | 'deploying' | 'completed' | 'error'>('pending');
  const [currentStep, setCurrentStep] = useState('');
  const [waitTimeRemaining, setWaitTimeRemaining] = useState(0);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  
  // VTEX Credentials (inicializar con valores del backend)
  const [vtexAccount, setVtexAccount] = useState('tiendauno');
  const [vtexAppKey, setVtexAppKey] = useState('vtexappkey-kudosio-OJJDGV');
  const [vtexAppToken, setVtexAppToken] = useState('NDNVZATPLTYTGQVFCYODYVPCRHRURCNSTUAGSNULVFLLFMKZTFAHRWKROLDRIZYIFFALQOMPDDHTKEWEWSAMCGBXKISHJCCWGCFZMZIETLENOQHKOZUQYLGZDCAHWFGA');
  const [workspace, setWorkspace] = useState('customlanding');

  const pollDeployStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/github/deploy-status/${landingId}`);
      const data = await response.json();
      
      if (data.status) {
        setDeployStatus(data.status);
        setCurrentStep(data.currentStep || '');
        setWaitTimeRemaining(data.waitTimeRemaining || 0);
        
        // Update result with latest data
        setResult(prev => ({
          ...prev,
          ...data,
          logs: data.logs || prev?.logs || []
        }));
      }
      
      // Stop polling if completed or error
      if (data.status === 'completed' || data.status === 'error') {
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
        setIsDeploying(false);
      }
    } catch (error) {
      console.error('Error polling deploy status:', error);
    }
  }, [landingId, pollingInterval]);

  const handleDeploy = async () => {
    if (!vtexAccount || !vtexAppKey || !vtexAppToken) {
      alert('Por favor completa todas las credenciales VTEX');
      return;
    }

    setIsDeploying(true);
    setResult(null);
    setDeployStatus('pending');
    setCurrentStep('');
    setWaitTimeRemaining(0);

    try {
      const response = await fetch(`/api/github/deploy-direct/${landingId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspace,
          vtexAccount,
          vtexAppKey,
          vtexAppToken,
        }),
      });

      const data = await response.json();
      
      // Check if the initial response indicates failure
      if (!response.ok || !data.success) {
        setResult({
          success: false,
          message: data.message || 'Error en el deploy',
          error: data.error || 'Error desconocido',
          logs: data.logs || []
        });
        setIsDeploying(false);
        return;
      }
      
      setResult(data);
      
      // Start polling for status updates
      const interval = setInterval(pollDeployStatus, 2000); // Poll every 2 seconds
      setPollingInterval(interval);
      
      // Initial poll
      pollDeployStatus();
      
    } catch (error) {
      setResult({
        success: false,
        message: 'Error de conexión',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
      setIsDeploying(false);
    }
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  if (!isOpen) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800">Deploy Directo (VTEX CLI)</h3>
            <p className="text-sm text-gray-600 mt-1">
              Despliega la landing inmediatamente usando VTEX CLI (sin GitHub Actions)
            </p>
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Rocket size={18} />
            Configurar Deploy
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">Deploy Directo - {landingName}</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      {/* VTEX Credentials Form */}
      <div className="space-y-4 mb-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-yellow-800">
            <AlertCircle size={16} className="inline mr-2" />
            Las credenciales VTEX se usan solo para este deploy y no se almacenan.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            VTEX Account
          </label>
          <input
            type="text"
            value={vtexAccount}
            onChange={(e) => setVtexAccount(e.target.value)}
            placeholder="ej: tiendauno"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            VTEX App Key
          </label>
          <input
            type="password"
            value={vtexAppKey}
            onChange={(e) => setVtexAppKey(e.target.value)}
            placeholder="vtexappkey-..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            VTEX App Token
          </label>
          <input
            type="password"
            value={vtexAppToken}
            onChange={(e) => setVtexAppToken(e.target.value)}
            placeholder="Token de VTEX..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Workspace
          </label>
          <select
            value={workspace}
            onChange={(e) => setWorkspace(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="customlanding">customlanding (desarrollo)</option>
            <option value="master">master (producción)</option>
          </select>
        </div>
      </div>

      {/* Deploy Button */}
      <button
        onClick={handleDeploy}
        disabled={isDeploying}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2 font-medium"
      >
        {isDeploying ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            {deployStatus === 'pending' && 'Iniciando deploy...'}
            {deployStatus === 'cloning' && 'Clonando repositorio...'}
            {deployStatus === 'publishing' && 'Publicando en VTEX...'}
            {deployStatus === 'installing' && 'Instalando aplicación...'}
            {deployStatus === 'waiting' && (
              <>
                <Clock size={20} className="animate-pulse" />
                Esperando período de prueba VTEX ({Math.ceil(waitTimeRemaining / 60)}:{(waitTimeRemaining % 60).toString().padStart(2, '0')} min)
              </>
            )}
            {deployStatus === 'deploying' && 'Aplicando cambios finales...'}
            {deployStatus === 'completed' && '✅ Deploy completado'}
            {deployStatus === 'error' && '❌ Error en deploy'}
          </>
        ) : (
          <>
            <Rocket size={20} />
            Desplegar Landing (10-15 min)
          </>
        )}
      </button>

      {/* Status Progress Bar */}
      {isDeploying && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progreso del Deploy</span>
            {currentStep && <span className="text-sm text-gray-600">{currentStep}</span>}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{
                width: deployStatus === 'pending' ? '10%' :
                       deployStatus === 'cloning' ? '20%' :
                       deployStatus === 'publishing' ? '40%' :
                       deployStatus === 'installing' ? '60%' :
                       deployStatus === 'waiting' ? '80%' :
                       deployStatus === 'deploying' ? '90%' :
                       deployStatus === 'completed' ? '100%' : '10%'
              }}
            />
          </div>
          {deployStatus === 'waiting' && (
            <p className="text-xs text-yellow-600 mt-2">
              ⏱️ VTEX requiere un período de prueba de 10 minutos después del publish antes de permitir el deploy final.
            </p>
          )}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`mt-4 p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-start gap-2">
            {result.success ? (
              <CheckCircle size={20} className="text-green-600 mt-0.5" />
            ) : (
              <AlertCircle size={20} className="text-red-600 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                {result.message}
              </p>
              
              {result.previewUrl && (
                <a
                  href={result.previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-blue-600 hover:text-blue-800"
                >
                  <Eye size={16} />
                  Ver landing: {result.previewUrl}
                </a>
              )}

              {result.error && (
                <p className="text-red-600 text-sm mt-2">{result.error}</p>
              )}

              {/* Logs Toggle */}
              {result.logs && result.logs.length > 0 && (
                <div className="mt-3">
                  <button
                    onClick={() => setShowLogs(!showLogs)}
                    className="text-sm text-gray-600 hover:text-gray-800 underline"
                  >
                    {showLogs ? 'Ocultar logs' : 'Ver logs'}
                  </button>
                  
                  {showLogs && (
                    <div className="mt-2 bg-gray-900 text-gray-100 p-3 rounded-lg text-xs font-mono max-h-60 overflow-y-auto">
                      {result.logs.map((log, i) => (
                        <div key={i} className="py-0.5">{log}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
