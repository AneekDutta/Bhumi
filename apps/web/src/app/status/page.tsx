import { apiClient } from '@/lib/api'

export default async function StatusPage() {
  let backendHealth = null;
  let errorMsg = null;
  
  try {
    backendHealth = await apiClient.getHealth();
  } catch (error: any) {
    errorMsg = error.message;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">System Status</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold mb-4">Backend Connection</h2>
        {backendHealth ? (
          <div className="space-y-2">
            <p>Status: <span className="font-mono text-green-600">{backendHealth.status}</span></p>
            <p>Version: <span className="font-mono">{backendHealth.version}</span></p>
            <p>Database: <span className="font-mono">{backendHealth.services?.database}</span></p>
          </div>
        ) : (
          <div className="space-y-2 text-red-600">
            <p>Failed to connect to backend.</p>
            <p className="text-sm font-mono">{errorMsg}</p>
          </div>
        )}
      </div>
    </div>
  )
}
