import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

interface Order {
  id: string;
  game: string;
  service: string;
  price: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  date: string;
  userId: string;
  boosterId?: string;
  boosterName?: string;
  User?: {
    name?: string;
    email?: string;
  };
  Booster?: {
    name?: string;
    email?: string;
  };
}

interface Booster {
  id: string;
  name: string;
  email: string;
  role: string;
  activeOrders: number;
  completedOrders: number;
  totalEarnings: number;
}

const BoostersPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [boosters, setBoosters] = useState<Booster[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningOrder, setAssigningOrder] = useState<string | null>(null);
  const [selectedBooster, setSelectedBooster] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<string>('');
  const [assignmentLoading, setAssignmentLoading] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user?.role !== 'ADMIN') {
      router.push('/auth/signin');
      return;
    }
  }, [session, status, router]);

  const fetchBoosters = async () => {
    try {
      const response = await fetch('/api/admin/boosters');
      if (response.ok) {
        const data = await response.json();
        setBoosters(data.boosters);
      }
    } catch (error) {
      console.error('Error fetching boosters:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/admin/orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  // Fetch orders and boosters
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await Promise.all([fetchOrders(), fetchBoosters()]);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.role === 'ADMIN') {
      fetchData();
    }
  }, [session]);

  const assignBooster = async () => {
    if (!selectedOrder || !selectedBooster) {
      alert('Please select an order and booster');
      return;
    }

    try {
      setAssigningOrder(selectedOrder);
      
      const response = await fetch('/api/admin/assign-booster', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId: selectedOrder, boosterId: selectedBooster }),
      });

      if (response.ok) {
        // Refresh the data
        await Promise.all([fetchOrders(), fetchBoosters()]);
        
        // Reset selections
        setSelectedOrder('');
        setSelectedBooster('');
        
        alert('Booster assigned successfully!');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error assigning booster:', error);
      alert('An error occurred while assigning the booster');
    } finally {
      setAssigningOrder(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'in_progress':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-white text-xl">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (!session || session.user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Boosters Management</h1>
            <p className="text-gray-400">Assign boosters to orders and manage tasks</p>
          </div>

          {/* Assignment Section */}
          <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Assign Booster to Order</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Order</label>
                <select
                  value={selectedOrder}
                  onChange={(e) => setSelectedOrder(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Order</option>
                  {orders.filter(order => !order.boosterId && !order.boosterName).map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.User?.name || order.User?.email?.split('@')[0] || 'Unknown'} - {order.game} - ${order.price}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Select Booster</label>
                <select
                  value={selectedBooster}
                  onChange={(e) => setSelectedBooster(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select Booster --</option>
                  {boosters.map(booster => (
                    <option key={booster.id} value={booster.id}>
                      {booster.name} - ({booster.activeOrders} active orders)
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={assignBooster}
                  disabled={!!assigningOrder || !selectedBooster || selectedOrder === ''}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {assigningOrder ? 'Assigning...' : 'Assign Booster'}
                </button>
              </div>
            </div>
          </div>

          {/* Boosters Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {boosters.map(booster => (
              <div key={booster.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{booster.name}</h3>
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                    {booster.role}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Active Orders:</span>
                    <span className="text-yellow-400 font-semibold">{booster.activeOrders || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Completed Orders:</span>
                    <span className="text-green-400 font-semibold">{booster.completedOrders || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Earnings:</span>
                    <span className="text-blue-400 font-semibold">${booster.totalEarnings?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Orders Table */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold">All Orders</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Game
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Booster
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                        #{order.id.slice(-6)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {order.User?.name || order.User?.email?.split('@')[0] || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {order.game}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {order.service}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-400">
                        ${order.price}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {order.Booster?.name || order.boosterName ? (
                          <span className="text-blue-400 font-semibold">
                            {order.Booster?.name || order.boosterName}
                          </span>
                        ) : (
                          <span className="text-gray-500">Not Assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {new Date(order.date).toLocaleDateString('ar-SA')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BoostersPage;