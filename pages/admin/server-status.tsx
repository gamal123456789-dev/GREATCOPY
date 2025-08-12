// Server Status Monitoring Page
import { useEffect, useState } from 'react';

export default function ServerStatus() {
  const [status, setStatus] = useState({ 
    websocket: false,
    api: false,
    uptime: 0,
    memoryUsage: ''
  });

  useEffect(() => {
    fetch('/api/admin/server-status')
      .then(res => res.json())
      .then(data => setStatus(data));
  }, []);

  return (
    <div className="p-4 bg-gray-800 text-white">
      <h2 className="text-xl mb-4">Server Status</h2>
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${status.websocket ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>WebSocket Connection: {status.websocket ? 'Active' : 'Inactive'}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${status.api ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>API Status: {status.api ? 'Healthy' : 'Error'}</span>
        </div>
        <div>Uptime: {Math.floor(status.uptime / 60)} minutes</div>
      <div>Memory Usage: {status.memoryUsage}</div>
      </div>
    </div>
  );
}