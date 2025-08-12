import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '../../context/UserContext';
import { useOrders } from '../../context/OrdersContext';
import ChatInterface from '../../components/ChatInterface';
import NotificationCenter from '../../components/NotificationCenter';
import UnreadBadge from '../../components/UnreadBadge';
import { useUnreadCounts } from '../../hooks/useUnreadCounts';


// --- Interfaces ---
interface Order {
  id: string;
  customerName: string;
  game: string;
  service: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  price: number;
  date: string;
  notes?: string;
}
interface PriceChange {
  id: string;
  orderId: string;
  oldPrice: number;
  newPrice: number;
  reason: string;
  changedBy: string;
  changeDate: string;
}
interface Customer {
  id: string;
  name: string;
  email: string;
  totalSpent: number;
  orders: number;
}
interface Game {
  id: string;
  name: string;
  services: string[];
}
interface ChatMessage {
  id: string;
  content: string;
  user?: {
    displayName: string;
    role: string;
  };
  isSystem?: boolean;
  createdAt: string;
}
interface Stat {
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
  icon: React.ReactNode;
}
interface NavItem {
  name: string;
  icon: React.ReactNode;
}

// --- SVG Icons ---
const Icons = {
  dashboard: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  orders: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
  customers: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 21a6 6 0 006-6v-1a6 6 0 00-9-5.197" /></svg>,
  games: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /></svg>,
  settings: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  revenue: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>,
};

// --- Search and Filter Component ---
const SearchAndFilter: React.FC<{
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  gameFilter: string;
  setGameFilter: (game: string) => void;
  minPrice: string;
  setMinPrice: (price: string) => void;
  maxPrice: string;
  setMaxPrice: (price: string) => void;
  onClearFilters: () => void;
}> = ({ searchTerm, setSearchTerm, statusFilter, setStatusFilter, gameFilter, setGameFilter, minPrice, setMinPrice, maxPrice, setMaxPrice, onClearFilters }) => {
  // Define available games based on common games in the system
  const availableGames = [
    'New World',
    'Black Desert Online', 
    'Rust',
    'Path of Exile',
    'Destiny 2',
    'War Thunder',
    'Path of Exile 2',
    'WarFrame'
  ];
  return (
    <div className="bg-gradient-to-br from-slate-800 to-gray-800 p-6 rounded-2xl mb-6 border border-slate-700/50 shadow-2xl">
      <h3 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-4">Search & Filter</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Search Term */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search orders, customers..."
            className="w-full bg-slate-600 text-white px-3 py-2 rounded-lg border border-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
        
        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-600 text-white px-3 py-2 rounded-lg border border-slate-500 focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        
        {/* Game Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Game</label>
          <select
            value={gameFilter}
            onChange={(e) => setGameFilter(e.target.value)}
            className="w-full bg-slate-600 text-white px-3 py-2 rounded-lg border border-slate-500 focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Games</option>
            {availableGames.map(game => (
              <option key={game} value={game}>{game}</option>
            ))}
          </select>
        </div>
        
        {/* Price Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Min Price</label>
          <input
            type="number"
            step="0.01"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="0.00"
            className="w-full bg-slate-600 text-white px-3 py-2 rounded-lg border border-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Max Price</label>
          <input
            type="number"
            step="0.01"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="999.99"
            className="w-full bg-slate-600 text-white px-3 py-2 rounded-lg border border-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>
      
      {/* Clear Filters Button */}
      <div className="mt-4">
        <button
          onClick={onClearFilters}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Clear All Filters
        </button>
      </div>
    </div>
  );
};

// --- Reusable Components ---
const Sidebar: React.FC<{ activePage: string; setActivePage: (page: string) => void }> = ({ activePage, setActivePage }) => {
  const router = useRouter();
  const navItems: NavItem[] = [
    { name: 'Dashboard', icon: Icons.dashboard },
    { name: 'Manage Orders', icon: Icons.orders },
    { name: 'Manage Users', icon: Icons.customers },
    { name: 'Reports', icon: Icons.games },
    { name: 'Settings', icon: Icons.settings },
  ];

  const handleLogout = () => {
    // Add logout functionality here
    window.location.href = 'https://gear-score.com/api/auth/signout';
  };

  return (
    <aside className="w-64 bg-gradient-to-b from-slate-900 via-gray-900 to-slate-900 text-gray-200 flex flex-col h-screen fixed border-r border-slate-700/50 shadow-2xl">
      <div className="p-6 text-center border-b border-slate-700/50">
        <div className="flex items-center justify-center mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Gearscore</h1>
        </div>
        <p className="text-xs text-gray-400 mt-1">Admin Dashboard</p>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <a
            key={item.name}
            href="#"
            onClick={(e) => { e.preventDefault(); setActivePage(item.name); }}
            className={`group flex items-center px-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium ${
              item.name === activePage 
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105' 
                : 'text-gray-300 hover:bg-slate-800/50 hover:text-white hover:transform hover:scale-105'
            }`}
          >
            <div className={`w-5 h-5 mr-3 transition-transform duration-300 ${
              item.name === activePage ? 'scale-110' : 'group-hover:scale-110'
            }`}>{item.icon}</div>
            <span>{item.name}</span>
            {item.name === activePage && (
              <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
            )}
          </a>
        ))}
        
        {/* Deleted Items Link */}
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); router.push('/admin/deleted-items'); }}
          className="group flex items-center px-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium text-gray-300 hover:bg-slate-800/50 hover:text-white hover:transform hover:scale-105"
        >
          <div className="w-5 h-5 mr-3 transition-transform duration-300 group-hover:scale-110">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <span>Deleted Items</span>
        </a>
        
        {/* Custom Payments Link */}
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); setActivePage('Custom Payments'); }}
          className={`group flex items-center px-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium ${
            activePage === 'Custom Payments'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
              : 'text-gray-300 hover:bg-slate-800/50 hover:text-white hover:transform hover:scale-105'
          }`}
        >
          <div className={`w-5 h-5 mr-3 transition-transform duration-300 ${
            activePage === 'Custom Payments' ? 'scale-110' : 'group-hover:scale-110'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <span>Custom Payments</span>
          {activePage === 'Custom Payments' && (
            <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
          )}
        </a>
        
        {/* Manual Orders Link */}
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); setActivePage('Manual Orders'); }}
          className={`group flex items-center px-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium ${
            activePage === 'Manual Orders'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
              : 'text-gray-300 hover:bg-slate-800/50 hover:text-white hover:transform hover:scale-105'
          }`}
        >
          <div className={`w-5 h-5 mr-3 transition-transform duration-300 ${
            activePage === 'Manual Orders' ? 'scale-110' : 'group-hover:scale-110'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <span>Manual Orders</span>
          {activePage === 'Manual Orders' && (
            <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
          )}
        </a>
        
        {/* Analytics Link */}
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); setActivePage('Analytics'); }}
          className={`group flex items-center px-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium ${
            activePage === 'Analytics'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
              : 'text-gray-300 hover:bg-slate-800/50 hover:text-white hover:transform hover:scale-105'
          }`}
        >
          <div className="w-5 h-5 mr-3 transition-transform duration-300 group-hover:scale-110">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <span>Analytics</span>
          {activePage === 'Analytics' && (
            <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
          )}
        </a>
      </nav>
      <div className="p-4 border-t border-slate-700/50">
        <button
          onClick={handleLogout}
          className="group flex items-center px-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium text-red-400 hover:bg-red-900/20 hover:text-red-300 w-full hover:transform hover:scale-105"
        >
          <svg className="w-5 h-5 mr-3 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

const PriceChangesTable: React.FC<{ priceChanges: PriceChange[]; orders: Order[]; onAddPriceChange: (orderId: string, oldPrice: number, newPrice: number, reason: string) => Promise<void>; onDeletePriceChange: (id: string, deleteReason: string) => Promise<void>; }> = ({ priceChanges, orders, onAddPriceChange, onDeletePriceChange }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [reason, setReason] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; show: boolean }>({ id: '', show: false });
  const [deleteReason, setDeleteReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedOrderId && newPrice && reason) {
      const selectedOrder = orders.find(order => order.id === selectedOrderId);
      if (selectedOrder) {
        const parsedNewPrice = parseFloat(newPrice);
        if (!isNaN(parsedNewPrice) && parsedNewPrice > 0) {
          try {
            await onAddPriceChange(selectedOrderId, selectedOrder.price, parsedNewPrice, reason);
            setSelectedOrderId('');
            setNewPrice('');
            setReason('');
            setShowAddForm(false);
          } catch (error) {
            console.error('Error updating price:', error);
          }
        } else {
          alert('Please enter a valid price greater than 0');
        }
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getOrderInfo = (orderId: string) => {
    return orders.find(order => order.id === orderId);
  };

  const handleDeletePriceChange = async (id: string) => {
    if (!deleteReason.trim()) {
      alert('Please provide a reason for deletion');
      return;
    }
    
    setIsDeleting(true);
    try {
      await onDeletePriceChange(id, deleteReason);
      setDeleteConfirm({ id: '', show: false });
      setDeleteReason('');
      alert('Price change deleted successfully!');
    } catch (error) {
      console.error('Error deleting price change:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete price change';
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const showDeleteConfirm = (id: string) => {
    setDeleteConfirm({ id, show: true });
    setDeleteReason('');
  };

  const hideDeleteConfirm = () => {
    setDeleteConfirm({ id: '', show: false });
    setDeleteReason('');
  };

  return (
    <div className="bg-gradient-to-br from-slate-800 to-gray-800 p-8 rounded-2xl mt-8 border border-slate-700/50 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Price Changes Log</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          {showAddForm ? 'Cancel' : 'Add Price Change'}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-slate-700/50 p-6 rounded-xl mb-6 border border-slate-600/50">
          <h4 className="text-lg font-semibold text-white mb-4">Add New Price Change</h4>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Order</label>
              <select
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="w-full bg-slate-600 text-white px-3 py-2 rounded-lg border border-slate-500 focus:border-blue-500 focus:outline-none"
                required
              >
                <option value="">Select Order</option>
                {orders.map(order => (
                  <option key={order.id} value={order.id}>
                    {`O-${order.id.slice(0, 4).toUpperCase()} - ${order.customerName} - $${order.price}`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">New Price</label>
              <input
                type="number"
                step="0.01"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="w-full bg-slate-600 text-white px-3 py-2 rounded-lg border border-slate-500 focus:border-blue-500 focus:outline-none"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Reason for Change</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-slate-600 text-white px-3 py-2 rounded-lg border border-slate-500 focus:border-blue-500 focus:outline-none"
                placeholder="Enter reason for price change"
                required
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Save Change
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-700/50">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gradient-to-r from-slate-700 to-gray-700 text-gray-300">
              <th className="p-4 font-semibold">Order ID</th>
              <th className="p-4 font-semibold">Customer</th>
              <th className="p-4 font-semibold">Old Price</th>
              <th className="p-4 font-semibold">New Price</th>
              <th className="p-4 font-semibold">Difference</th>
              <th className="p-4 font-semibold">Reason</th>
              <th className="p-4 font-semibold">Changed By</th>
              <th className="p-4 font-semibold">Date</th>
              <th className="p-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {priceChanges.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-4 text-center text-gray-400">No price changes yet.</td>
              </tr>
            ) : (
              [...priceChanges].sort((a, b) => new Date(b.changeDate).getTime() - new Date(a.changeDate).getTime()).map((change, index) => {
                const orderInfo = getOrderInfo(change.orderId);
                const oldPrice = typeof change.oldPrice === 'number' ? change.oldPrice : parseFloat(change.oldPrice) || 0;
                const newPrice = typeof change.newPrice === 'number' ? change.newPrice : parseFloat(change.newPrice) || 0;
                const priceDifference = newPrice - oldPrice;
                const isIncrease = priceDifference > 0;
                
                return (
                  <tr key={change.id} className={`border-b border-slate-700/30 hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-purple-500/10 transition-all duration-300 ${index % 2 === 0 ? 'bg-slate-800/30' : 'bg-slate-900/30'}`}>
                    <td className="p-4">
                      <span className="text-white font-mono bg-gray-700 px-2 py-1 rounded text-sm">
                        O-{change.orderId.slice(0, 4).toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-white font-medium">
                      {orderInfo ? orderInfo.customerName : 'Unknown'}
                    </td>
                    <td className="p-4 text-red-400 font-bold text-lg line-through">
                      ${oldPrice.toFixed(2)}
                    </td>
                    <td className="p-4 text-emerald-400 font-bold text-lg">
                      ${newPrice.toFixed(2)}
                    </td>
                    <td className="p-4">
                      <span className={`font-bold text-lg ${isIncrease ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isIncrease ? '+' : ''}${priceDifference.toFixed(2)}
                      </span>
                    </td>
                    <td className="p-4 text-gray-300">
                      <div className="bg-slate-700/50 px-3 py-2 rounded-lg border border-slate-600/50">
                        {change.reason}
                      </div>
                    </td>
                    <td className="p-4 text-blue-400 font-medium">{change.changedBy}</td>
                    <td className="p-4 text-gray-300">{formatDate(change.changeDate)}</td>
                    <td className="p-4">
                      <button
                        onClick={() => showDeleteConfirm(change.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Confirm Deletion</h3>
            <p className="text-gray-300 mb-4">Are you sure you want to delete this price change? This action cannot be undone.</p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Reason for deletion</label>
              <input
                type="text"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="w-full bg-slate-600 text-white px-3 py-2 rounded-lg border border-slate-500 focus:border-blue-500 focus:outline-none"
                placeholder="Enter reason for deletion"
                required
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={hideDeleteConfirm}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeletePriceChange(deleteConfirm.id)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                disabled={isDeleting || !deleteReason.trim()}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
 };

const StatCard: React.FC<{ stat: Stat; onNavigateToOrders?: () => void }> = ({ stat, onNavigateToOrders }) => {
  const changeColor = stat.changeType === 'increase' ? 'text-emerald-400' : 'text-red-400';
  const changeIcon = stat.changeType === 'increase' ? '↗' : '↘';
  
  const handleClick = () => {
    if (onNavigateToOrders && (stat.title.includes('Orders') || stat.title.includes('Revenue'))) {
      onNavigateToOrders();
    }
  };
  
  const isClickable = stat.title.includes('Orders') || stat.title.includes('Revenue');
  
  // Enhanced styling for better visual appeal
  const getCardGradient = () => {
    if (stat.title.includes('Total Orders')) return 'from-blue-900/40 to-blue-800/40';
    if (stat.title.includes('New Orders')) return 'from-purple-900/40 to-purple-800/40';
    if (stat.title.includes('Completed')) return 'from-green-900/40 to-green-800/40';
    if (stat.title.includes('Cancelled')) return 'from-red-900/40 to-red-800/40';
    if (stat.title.includes('Revenue')) return 'from-yellow-900/40 to-yellow-800/40';
    return 'from-slate-900/40 to-slate-800/40';
  };
  
  const getIconColor = () => {
    if (stat.title.includes('Total Orders')) return 'text-blue-400';
    if (stat.title.includes('New Orders')) return 'text-purple-400';
    if (stat.title.includes('Completed')) return 'text-green-400';
    if (stat.title.includes('Cancelled')) return 'text-red-400';
    if (stat.title.includes('Revenue')) return 'text-yellow-400';
    return 'text-gray-400';
  };
  
  const getIconBackground = () => {
    if (stat.title.includes('Total Orders')) return 'from-blue-500/20 to-blue-600/20 group-hover:from-blue-500/30 group-hover:to-blue-600/30';
    if (stat.title.includes('New Orders')) return 'from-purple-500/20 to-purple-600/20 group-hover:from-purple-500/30 group-hover:to-purple-600/30';
    if (stat.title.includes('Completed')) return 'from-green-500/20 to-green-600/20 group-hover:from-green-500/30 group-hover:to-green-600/30';
    if (stat.title.includes('Cancelled')) return 'from-red-500/20 to-red-600/20 group-hover:from-red-500/30 group-hover:to-red-600/30';
    if (stat.title.includes('Revenue')) return 'from-yellow-500/20 to-yellow-600/20 group-hover:from-yellow-500/30 group-hover:to-yellow-600/30';
    return 'from-gray-500/20 to-gray-600/20 group-hover:from-gray-500/30 group-hover:to-gray-600/30';
  };
  
  return (
    <div 
      className={`group relative overflow-hidden bg-gradient-to-br ${getCardGradient()} backdrop-blur-sm p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10 hover:transform hover:scale-[1.02] ${
        isClickable ? 'cursor-pointer' : ''
      }`}
      onClick={handleClick}
    >
      {/* Animated background effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
      
      <div className="relative z-10 flex items-center">
        <div className={`p-4 bg-gradient-to-br ${getIconBackground()} rounded-xl mr-4 transition-all duration-300 shadow-lg`}>
          <div className={`${getIconColor()} group-hover:scale-110 transition-transform duration-300 text-2xl`}>{stat.icon}</div>
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-300 font-medium mb-1">{stat.title}</p>
          <p className="text-3xl font-bold text-white mb-2 tracking-tight">{stat.value}</p>
          <div className="flex items-center">
            <span className={`text-sm font-semibold ${changeColor} flex items-center bg-white/5 px-2 py-1 rounded-lg`}>
              <span className="mr-1 text-base">{changeIcon}</span>
              {stat.change}
            </span>
          </div>
          {isClickable && (
            <div className="mt-3 text-xs text-blue-300 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
              <i className="fas fa-mouse-pointer mr-1"></i>
              Click to view details →
            </div>
          )}
        </div>
      </div>
      
      {/* Corner decoration */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-white/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </div>
  );
};

const OrdersTable: React.FC<{ orders: Order[]; selectedOrderId: string | null; onSelectOrder: (id: string) => void; onUpdateOrderStatus?: (orderId: string, newStatus: Order['status']) => void; onUpdateOrderDetails?: (orderId: string, updates: { status?: Order['status']; price?: number; service?: string; notes?: string }) => void; onAddPriceChange?: (orderId: string, oldPrice: number, newPrice: number, reason: string) => void; filteredOrders?: Order[]; getUnreadCount: (orderId: string) => number; }> = ({ orders, selectedOrderId, onSelectOrder, onUpdateOrderStatus, onUpdateOrderDetails, onAddPriceChange, filteredOrders, getUnreadCount }) => {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [editingOrder, setEditingOrder] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ price: string; service: string; priceChangeReason: string; notes: string }>({ price: '', service: '', priceChangeReason: '', notes: '' });
  const [originalValues, setOriginalValues] = useState<{ [key: string]: { price: number, service: string, notes: string } }>({});

  
  const getStatusClass = (status: Order['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400';
      case 'in_progress': return 'bg-yellow-500/20 text-yellow-400';
      case 'pending': return 'bg-blue-500/20 text-blue-400';
      case 'cancelled': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const handleStatusChange = (orderId: string, newStatus: Order['status']) => {
    if (onUpdateOrderStatus) {
      onUpdateOrderStatus(orderId, newStatus);
    }
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order.id);
    setEditValues({ price: order.price.toString(), service: order.service, priceChangeReason: '', notes: order.notes || '' });
    setOriginalValues(prev => ({
      ...prev,
      [order.id]: { price: order.price, service: order.service, notes: order.notes || '' }
    }));
  };

  const handleSaveEdit = async (orderId: string) => {
    if (onUpdateOrderDetails) {
      const updates: { price?: number; service?: string; notes?: string } = {};
      if (editValues.price) updates.price = parseFloat(editValues.price);
      if (editValues.service) updates.service = editValues.service;
      if (editValues.notes !== undefined) updates.notes = editValues.notes;
      
      // Track price change if price was modified and onAddPriceChange is available
      const originalPrice = originalValues[orderId]?.price;
      const newPrice = parseFloat(editValues.price);
      if (onAddPriceChange && originalPrice && newPrice !== originalPrice && editValues.priceChangeReason.trim()) {
        onAddPriceChange(orderId, originalPrice, newPrice, editValues.priceChangeReason);
      }
      
      await onUpdateOrderDetails(orderId, updates);
      setEditingOrder(null);
      setEditValues({ price: '', service: '', priceChangeReason: '', notes: '' });
      // Clean up original values after successful save
      setOriginalValues(prev => {
        const newValues = { ...prev };
        delete newValues[orderId];
        return newValues;
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingOrder(null);
    setEditValues({ price: '', service: '', priceChangeReason: '', notes: '' });
    // Clean up original values for cancelled edit
    if (editingOrder) {
      setOriginalValues(prev => {
        const newValues = { ...prev };
        delete newValues[editingOrder];
        return newValues;
      });
    }
  };

  const formatOrderId = (id: string) => {
    return `O-${id.slice(0, 4).toUpperCase()}`;
  };

  const toggleOrderIdExpansion = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  // Use filtered orders if provided, otherwise use all orders
  const ordersToDisplay = filteredOrders || orders;

  return (
    <div className="bg-gradient-to-br from-slate-800 to-gray-800 p-8 rounded-2xl mt-8 border border-slate-700/50 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">All Orders</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">Live Updates</span>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-700/50">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gradient-to-r from-slate-700 to-gray-700 text-gray-300">
              <th className="p-4 font-semibold">Order ID</th>
              <th className="p-4 font-semibold">Customer</th>
              <th className="p-4 font-semibold">Game</th>
              <th className="p-4 font-semibold">Service</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold">Price</th>
              <th className="p-4 font-semibold">Payment Method</th>
              <th className="p-4 font-semibold">Notes</th>
              <th className="p-4 font-semibold">Date</th>
              {onUpdateOrderStatus && <th className="p-4 font-semibold">Change Status</th>}
              {onUpdateOrderDetails && <th className="p-4 font-semibold">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {ordersToDisplay.length === 0 ? (
              <tr>
                <td colSpan={onUpdateOrderDetails ? 11 : 10} className="p-4 text-center text-gray-400">No orders found.</td>
              </tr>
            ) : [...ordersToDisplay].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((order, index) => (
              <tr key={order.id} onClick={() => onSelectOrder(order.id)} className={`border-b border-slate-700/30 hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-purple-500/10 cursor-pointer transition-all duration-300 ${order.id === selectedOrderId ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30' : ''} ${index % 2 === 0 ? 'bg-slate-800/30' : 'bg-slate-900/30'}`}>
                <td className="p-4" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleOrderIdExpansion(order.id)}
                      className="text-white font-mono bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-sm transition-colors flex items-center gap-1"
                      title="Click to expand full Order ID"
                    >
                      {expandedOrderId === order.id ? order.id : formatOrderId(order.id)}
                      <svg className={`w-3 h-3 transition-transform ${expandedOrderId === order.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <UnreadBadge count={getUnreadCount(order.id)} size="sm" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(order.id);
                        // Show temporary feedback
                        const btn = e.currentTarget;
                        const originalHTML = btn.innerHTML;
                        btn.innerHTML = '<svg class="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>';
                        setTimeout(() => {
                          btn.innerHTML = originalHTML;
                        }, 1500);
                      }}
                      className="p-1 hover:bg-gray-600 rounded transition-colors"
                      title="Copy Order ID"
                    >
                      <svg className="w-4 h-4 text-gray-400 hover:text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                        <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                      </svg>
                    </button>
                  </div>
                </td>
                <td className="p-4 text-white font-medium">{order.customerName}</td>
                <td className="p-4 text-white font-medium">{order.game}</td>
                <td className="p-4 text-gray-300">
                  {editingOrder === order.id ? (
                    <div className="flex flex-col gap-1">
                      {originalValues[order.id] && editValues.service !== originalValues[order.id].service && (
                        <div className="text-red-400 text-sm line-through">
                          {originalValues[order.id].service}
                        </div>
                      )}
                      <input
                        type="text"
                        value={editValues.service}
                        onChange={(e) => setEditValues(prev => ({ ...prev, service: e.target.value }))}
                        className="bg-slate-700 text-white px-2 py-1 rounded border border-slate-600 focus:border-blue-500 focus:outline-none text-sm w-full"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  ) : (
                    order.service
                  )}
                </td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td className="p-4 text-emerald-400 font-bold text-lg">
                  {editingOrder === order.id ? (
                    <div className="flex flex-col gap-1">
                      {originalValues[order.id] && parseFloat(editValues.price) !== originalValues[order.id].price && (
                        <div className="text-red-400 text-sm line-through">
                          ${originalValues[order.id].price.toFixed(2)}
                        </div>
                      )}
                      <input
                        type="number"
                        step="0.01"
                        value={editValues.price}
                        onChange={(e) => setEditValues(prev => ({ ...prev, price: e.target.value }))}
                        className="bg-slate-700 text-white px-2 py-1 rounded border border-slate-600 focus:border-blue-500 focus:outline-none text-sm w-20"
                        onClick={(e) => e.stopPropagation()}
                      />
                      {onAddPriceChange && originalValues[order.id] && parseFloat(editValues.price) !== originalValues[order.id].price && (
                        <input
                          type="text"
                          value={editValues.priceChangeReason}
                          onChange={(e) => setEditValues(prev => ({ ...prev, priceChangeReason: e.target.value }))}
                          placeholder="Reason for price change"
                          className="bg-slate-700 text-white px-2 py-1 rounded border border-slate-600 focus:border-blue-500 focus:outline-none text-xs w-32 mt-1"
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                    </div>
                  ) : (
                    `$${order.price.toFixed(2)}`
                  )}
                </td>
                <td className="p-4 text-center">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-700 text-gray-300">
                    Not Specified
                  </span>
                </td>
                <td className="p-4 text-gray-300">
                  {editingOrder === order.id ? (
                    <textarea
                      value={editValues.notes || ''}
                      onChange={(e) => setEditValues(prev => ({ ...prev, notes: e.target.value }))}
                      className="bg-slate-700 text-white px-2 py-1 rounded border border-slate-600 focus:border-blue-500 focus:outline-none text-sm w-full resize-none"
                      rows={2}
                      placeholder="Add notes..."
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <div className="text-sm text-gray-300 max-w-xs truncate" title={order.notes}>
                      {order.notes || 'No notes'}
                    </div>
                  )}
                </td>
                <td className="p-4 text-gray-300">{formatDate(order.date)}</td>
                {onUpdateOrderStatus && (
                  <td className="p-4" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                      className="bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none text-sm transition-colors hover:bg-slate-600"
                      disabled={editingOrder === order.id}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                )}
                {onUpdateOrderDetails && (
                  <td className="p-4" onClick={(e) => e.stopPropagation()}>
                    {editingOrder === order.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(order.id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEditOrder(order)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

const RecentOrdersTable: React.FC<{ orders: Order[]; selectedOrderId: string | null; onSelectOrder: (id: string) => void; getUnreadCount: (orderId: string) => number; }> = ({ orders, selectedOrderId, onSelectOrder, getUnreadCount }) => {
  const getStatusClass = (status: Order['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'in_progress': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'pending': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatOrderId = (id: string) => {
    return `O-${id.slice(0, 4).toUpperCase()}`;
  };

  const getGameIcon = (game: string) => {
    const gameIcons: { [key: string]: string } = {
      'Valorant': 'VAL',
      'League of Legends': 'LOL',
      'CS2': 'CS2',
      'Apex Legends': 'APEX',
      'Overwatch 2': 'OW2',
      'Fortnite': 'FN'
    };
    return gameIcons[game] || 'GAME';
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-gray-800/50 backdrop-blur-sm p-8 rounded-2xl mt-8 border border-white/10 shadow-2xl">
      {/* Animated background effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-pulse"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-lg">
              <i className="fas fa-clock text-blue-400 text-xl"></i>
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Recent Orders</h3>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-400">Live Updates</span>
          </div>
        </div>
        
        <div className="overflow-x-auto rounded-xl border border-slate-700/50">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gradient-to-r from-slate-700/50 to-gray-700/50 text-gray-300">
                <th className="p-4 font-semibold text-sm uppercase tracking-wider">Order ID</th>
                <th className="p-4 font-semibold text-sm uppercase tracking-wider">Customer</th>
                <th className="p-4 font-semibold text-sm uppercase tracking-wider">Game</th>
                <th className="p-4 font-semibold text-sm uppercase tracking-wider">Service</th>
                <th className="p-4 font-semibold text-sm uppercase tracking-wider">Status</th>
                <th className="p-4 font-semibold text-sm uppercase tracking-wider">Price</th>
                <th className="p-4 font-semibold text-sm uppercase tracking-wider">Date</th>
                <th className="p-4 font-semibold text-sm uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="p-4 bg-gray-700/50 rounded-full">
                        <i className="fas fa-inbox text-gray-400 text-2xl"></i>
                      </div>
                      <p className="text-gray-400 font-medium">No recent orders</p>
                      <p className="text-gray-500 text-sm">Orders will appear here once customers start placing them</p>
                    </div>
                  </td>
                </tr>
              ) : orders.slice(0, 10).map((order, index) => (
                <tr 
                  key={order.id} 
                  onClick={() => onSelectOrder(order.id)} 
                  className={`group transition-all duration-300 hover:bg-slate-700/30 cursor-pointer border-l-4 border-transparent hover:border-blue-500/50 ${
                    order.id === selectedOrderId ? 'bg-slate-700/50 border-l-blue-500' : ''
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-blue-400 font-semibold">{formatOrderId(order.id)}</span>
                      <UnreadBadge count={getUnreadCount(order.id)} size="sm" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(order.id);
                          // Show temporary feedback
                          const btn = e.currentTarget;
                          const originalHTML = btn.innerHTML;
                          btn.innerHTML = '<svg class="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>';
                          setTimeout(() => {
                            btn.innerHTML = originalHTML;
                          }, 1500);
                        }}
                        className="p-1 hover:bg-gray-600 rounded transition-colors"
                        title="Copy Order ID"
                      >
                        <svg className="w-4 h-4 text-gray-400 hover:text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                          <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                        </svg>
                      </button>
                      <div className="w-1 h-1 bg-blue-400 rounded-full opacity-50"></div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-white">{order.customerName.charAt(0).toUpperCase()}</span>
                      </div>
                      <span className="text-white font-medium">{order.customerName}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold">{getGameIcon(order.game)}</span>
                      <span className="text-white font-medium">{order.game}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-gray-300">{order.service}</span>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusClass(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-1">
                      <span className="text-green-400 font-bold text-lg">${order.price.toFixed(2)}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-gray-400 text-sm">{formatDate(order.date)}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectOrder(order.id);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1"
                        title="Open Chat"
                      >
                        <span className="text-blue-400 font-semibold">Chat</span>
                        <span>Chat</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {orders.length > 10 && (
          <div className="mt-4 text-center">
            <p className="text-gray-400 text-sm">Showing 10 of {orders.length} recent orders</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ChatPanel: React.FC<{ selectedOrderId: string | null }> = ({ selectedOrderId }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [chatSize, setChatSize] = useState('small'); // 'small', 'normal', 'large'

  const getSizeClass = () => {
    if (!isVisible) return 'w-0';
    if (!isExpanded) return 'w-16';
    
    switch (chatSize) {
      case 'small': return 'w-1/4';
      case 'large': return 'w-3/4';
      default: return 'w-1/2';
    }
  };

  return (
    <aside className={`${getSizeClass()} bg-gradient-to-b from-slate-900 to-gray-900 border-l border-slate-700/50 flex flex-col h-screen shadow-2xl transition-all duration-300 ease-in-out overflow-hidden`}>
      {/* Control Panel */}
      <div className="absolute top-4 left-2 z-10 flex flex-col gap-2">
        {/* Toggle Visibility */}
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg"
          title={isVisible ? 'Hide Chat' : 'Show Chat'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isVisible ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464m1.414 1.414L8.464 8.464m5.656 5.656l1.415 1.415m-1.415-1.415l1.415 1.415" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            )}
          </svg>
        </button>

        {isVisible && (
          <>
            {/* Toggle Expand/Collapse */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white hover:from-green-600 hover:to-teal-700 transition-all duration-200 shadow-lg"
              title={isExpanded ? 'Minimize Chat' : 'Expand Chat'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isExpanded ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                )}
              </svg>
            </button>

            {/* Size Controls */}
            {isExpanded && (
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => setChatSize('small')}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white transition-all duration-200 shadow-lg ${
                    chatSize === 'small' 
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-600' 
                      : 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-yellow-400 hover:to-orange-500'
                  }`}
                  title="Small Size"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <rect x="6" y="6" width="8" height="8" rx="1" />
                  </svg>
                </button>
                <button
                  onClick={() => setChatSize('normal')}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white transition-all duration-200 shadow-lg ${
                    chatSize === 'normal' 
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600' 
                      : 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-blue-400 hover:to-indigo-500'
                  }`}
                  title="Medium Size"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <rect x="4" y="4" width="12" height="12" rx="1" />
                  </svg>
                </button>
                <button
                  onClick={() => setChatSize('large')}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white transition-all duration-200 shadow-lg ${
                    chatSize === 'large' 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-600' 
                      : 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-purple-400 hover:to-pink-500'
                  }`}
                  title="Large Size"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <rect x="2" y="2" width="16" height="16" rx="1" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {isVisible && isExpanded && selectedOrderId ? (
          <div className="flex flex-col h-full">
            {/* Order Details Sidebar */}
            <div className="p-6 border-b border-slate-700/50 bg-gradient-to-r from-slate-800 to-gray-800">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Order Details</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                  <span className="text-gray-400 font-medium">Order ID:</span>
                  <span className="text-white font-mono bg-slate-600 px-2 py-1 rounded text-xs">{selectedOrderId.slice(0, 8)}...</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                  <span className="text-gray-400 font-medium">Status:</span>
                  <div className="flex items-center">
                    <span className="text-green-400 font-semibold">Active</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Chat Interface with admin-specific styling */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="admin-chat-wrapper h-full bg-gradient-to-br from-slate-800 to-gray-800 rounded-lg p-4 m-2">
                <ChatInterface orderId={selectedOrderId} className="h-full" />
              </div>
            </div>
          </div>
      ) : isVisible && isExpanded ? (
        <div className="flex items-center justify-center h-full p-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-700/50">
              <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-3">Chat with Support</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Select an order to start chatting<br/>with the customer</p>
          </div>
        </div>
      ) : isVisible && !isExpanded ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center p-2">
            <svg className="w-8 h-8 text-blue-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        </div>
      ) : null}
      
      {/* Admin-specific styles */}
      <style jsx>{`
        .admin-chat-wrapper :global(.chat-input-container) {
          margin-bottom: 20px;
          padding-bottom: 20px;
        }
      `}</style>
    </aside>
  );
};

const CustomersPage: React.FC<{ orders: Order[] }> = ({ orders }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, admin, user, paid, unpaid
  
  // Calculate analytics data for this component
  const getAnalyticsData = () => {
    const gameCounts = orders.reduce((acc, order) => {
      acc[order.game] = (acc[order.game] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const customerCounts = orders.reduce((acc, order) => {
      acc[order.customerName || 'Not Specified'] = (acc[order.customerName || 'Not Specified'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const hourlyDistribution = orders.reduce((acc, order) => {
      const hour = new Date(order.date).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    // Monthly trends analysis
    const monthlyTrends = orders.reduce((acc, order) => {
      const month = new Date(order.date).toISOString().slice(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = { orders: 0, revenue: 0, cancelled: 0 };
      }
      acc[month].orders++;
      if (order.status !== 'cancelled') {
        acc[month].revenue += order.price;
      }
      if (order.status === 'cancelled') {
        acc[month].cancelled++;
      }
      return acc;
    }, {} as Record<string, { orders: number; revenue: number; cancelled: number }>);
    
    // Game profitability analysis
    const gameRevenue = orders.reduce((acc, order) => {
      if (order.status !== 'cancelled') {
        if (!acc[order.game]) {
          acc[order.game] = { orders: 0, revenue: 0 };
        }
        acc[order.game].orders++;
        acc[order.game].revenue += order.price;
      }
      return acc;
    }, {} as Record<string, { orders: number; revenue: number }>);
    
    const gameProfitability = Object.entries(gameRevenue)
      .map(([game, data]) => ({
        game,
        orders: data.orders,
        revenue: data.revenue,
        avgValue: data.orders > 0 ? data.revenue / data.orders : 0
      }))
      .sort((a, b) => b.revenue - a.revenue);
    
    return {
      gameCounts,
      customerCounts,
      hourlyDistribution,
      monthlyTrends,
      gameProfitability,
      totalOrders: orders.length
    };
  };
  
  const analytics = getAnalyticsData();

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        console.error('Failed to load users');
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on selected filter
  const filteredUsers = users.filter(user => {
    switch (filter) {
      case 'admin':
        return user.role === 'ADMIN';
      case 'user':
        return user.role === 'user';
      case 'paid':
        return (user.totalSpent || 0) > 0;
      case 'unpaid':
        return (user.totalSpent || 0) === 0;
      default:
        return true;
    }
  });

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        // Update local state
        setUsers(users.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        ));
      } else {
        console.error('Failed to update user role');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <>
      <header className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-white">Manage Users</h2>
        <div className="flex items-center gap-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-gray-700 text-white px-4 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">All Users</option>
            <option value="admin">Admins Only</option>
            <option value="user">Regular Users</option>
            <option value="paid">Paid Users</option>
            <option value="unpaid">Users Without Purchases</option>
          </select>
          <span className="text-gray-400 text-sm">
            {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
          </span>
        </div>
      </header>
      <div className="bg-gray-800 p-6 rounded-xl mt-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-700 text-gray-300">
                <th className="p-4 font-medium">User ID</th>
                <th className="p-4 font-medium">Name/Username</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Role</th>
                <th className="p-4 font-medium">Total Orders</th>
                <th className="p-4 font-medium">Total Spent</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-gray-400">Loading users...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-gray-400">
                    {users.length === 0 ? 'No users yet.' : 'No users match the selected filter.'}
                  </td>
                </tr>
              ) : filteredUsers.map(user => (
                <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                   <td className="p-4 text-white font-mono">{user.id.slice(0, 8)}...</td>
                   <td className="p-4 text-white">{user.displayName || user.username || user.name || 'N/A'}</td>
                   <td className="p-4 text-white">{user.email}</td>
                   <td className="p-4">
                     <span className={`px-3 py-1 rounded text-sm font-medium ${
                       user.role === 'ADMIN' ? 'bg-red-500 text-white' : 'bg-gray-600 text-white'
                     }`}>
                       {user.role}
                     </span>
                   </td>
                   <td className="p-4 text-white">{user.totalOrders || 0}</td>
                   <td className="p-4 text-white">${(user.totalSpent || 0).toFixed(2)}</td>
                   <td className="p-4">
                     <select
                       value={user.role}
                       onChange={(e) => updateUserRole(user.id, e.target.value)}
                       className="bg-gray-700 text-white px-3 py-1 rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
                     >
                       <option value="user">User</option>
                       <option value="ADMIN">Admin</option>
                     </select>
                   </td>
                 </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Additional Quick Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm font-medium">Most Requested Games</p>
              <p className="text-white text-lg font-bold">
                {Object.entries(analytics.gameCounts).length > 0 
                  ? Object.entries(analytics.gameCounts).sort(([,a], [,b]) => b - a)[0][0]
                  : 'No Data Available'
                }
              </p>
            </div>
            <div className="text-indigo-200 text-3xl">🎮</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-cyan-600 to-cyan-800 p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cyan-100 text-sm font-medium">Most Active Customers</p>
              <p className="text-white text-lg font-bold">
                {Object.entries(analytics.customerCounts).length > 0 
                  ? Object.entries(analytics.customerCounts).sort(([,a], [,b]) => b - a)[0][0]
                  : 'No Data Available'
                }
              </p>
            </div>
            <div className="text-cyan-200 text-3xl">👑</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Peak Hour</p>
              <p className="text-white text-lg font-bold">
                {Object.entries(analytics.hourlyDistribution).length > 0 
                  ? `${Object.entries(analytics.hourlyDistribution).sort(([,a], [,b]) => b - a)[0][0]}:00`
                  : 'No Data Available'
                }
              </p>
            </div>
            <div className="text-emerald-200 text-3xl">📈</div>
          </div>
        </div>
      </div>
      
      {/* Monthly Trends */}
      <div className="bg-gradient-to-br from-slate-800 to-gray-800 p-6 rounded-2xl border border-slate-700/50 shadow-2xl mt-8">
        <h3 className="text-xl font-bold text-white mb-4">Monthly Trends</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(analytics.monthlyTrends)
            .sort(([a], [b]) => b.localeCompare(a))
            .slice(0, 6)
            .map(([month, data]) => {
              const monthName = new Date(month + '-01').toLocaleDateString('ar-SA', { year: 'numeric', month: 'long' });
              return (
                <div key={month} className="bg-slate-700/50 p-4 rounded-xl">
                  <h4 className="text-white font-medium mb-2">{monthName}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Orders:</span>
                      <span className="text-blue-400 font-bold">{data.orders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Revenue:</span>
                      <span className="text-green-400 font-bold">${data.revenue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Cancelled:</span>
                      <span className="text-red-400 font-bold">{data.cancelled}</span>
                    </div>
                  </div>
                </div>
              );
            })
          }
        </div>
      </div>
      
      {/* Advanced Profitability Analysis */}
      <div className="bg-gradient-to-br from-slate-800 to-gray-800 p-6 rounded-2xl border border-slate-700/50 shadow-2xl mt-8">
        <h3 className="text-xl font-bold text-white mb-4">Advanced Profitability Analysis</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-700/50 text-gray-300">
                <th className="p-4 font-medium">Game</th>
                <th className="p-4 font-medium">Orders</th>
                <th className="p-4 font-medium">Revenue</th>
                <th className="p-4 font-medium">Average Value</th>
                <th className="p-4 font-medium">Profitability Index</th>
              </tr>
            </thead>
            <tbody>
              {analytics.gameProfitability.slice(0, 10).map((game, index) => {
                const profitabilityScore = (game.revenue * 0.7) + (game.avgValue * 0.3);
                const scoreColor = profitabilityScore > 100 ? 'text-green-400' : 
                                 profitabilityScore > 50 ? 'text-yellow-400' : 'text-red-400';
                return (
                  <tr key={game.game} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="p-4 text-white font-medium">
                      <div className="flex items-center">
                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold mr-2">#{index + 1}</span>
                        {game.game}
                      </div>
                    </td>
                    <td className="p-4 text-gray-300">{game.orders}</td>
                    <td className="p-4 text-green-400 font-bold">${game.revenue.toFixed(2)}</td>
                    <td className="p-4 text-blue-400">${game.avgValue.toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`font-bold ${scoreColor}`}>
                        {profitabilityScore.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

const GamesPage: React.FC = () => {
  const [gameReports, setGameReports] = useState<any[]>([]);
  const [serviceReports, setServiceReports] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('30'); // days

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/reports?days=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        
        // Handle both old and new API response formats
        if (Array.isArray(data)) {
          // Old format - assume it's game data
          setGameReports(data);
          setServiceReports([]);
          setSummary(null);
        } else if (data.games && data.services) {
          // New format with comprehensive data
          setGameReports(data.games || []);
          setServiceReports(data.services || []);
          setSummary(data.summary || null);
        } else {
          // Fallback
          setGameReports([]);
          setServiceReports([]);
          setSummary(null);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load reports');
        console.error('Failed to load reports:', errorData);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
      setError('Network error occurred while loading reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [timeRange]);

  const getGameIcon = (gameName: string) => {
    const gameIcons: { [key: string]: string } = {
      'World of Warcraft': 'WOW',
      'Final Fantasy XIV': 'FF14',
      'Lost Ark': 'LA',
      'New World': 'NW',
      'Guild Wars 2': 'GW2',
      'Elder Scrolls Online': 'ESO',
      'Black Desert Online': 'BDO',
      'Destiny 2': 'D2',
      'Diablo 4': 'D4',
      'Path of Exile': 'POE'
    };
    return gameIcons[gameName] || 'GAME';
  };

  const getServiceIcon = (serviceName: string) => {
    const serviceIcons: { [key: string]: string } = {
      'Boosting': 'BOOST',
      'Farming': 'FARM',
      'Leveling': 'LVL',
      'Item Acquisition': 'ITEM',
      'Coaching': 'COACH',
      'Account Services': 'ACC'
    };
    return serviceIcons[serviceName] || 'SRV';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-4 text-white">Loading reports...</span>
      </div>
    );
  }

  return (
    <>
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Reports & Analytics</h2>
          <p className="text-gray-400">Comprehensive performance insights and statistics</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-gradient-to-r from-gray-700 to-gray-600 text-white px-4 py-2 rounded-lg border border-gray-500 focus:border-blue-500 focus:outline-none transition-all duration-200 shadow-lg"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <button
            onClick={loadReports}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-lg transform hover:scale-105"
          >
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-6 py-4 rounded-lg mb-6 backdrop-blur-sm">
          <div className="flex items-center">
            <span className="text-xl mr-2">⚠️</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 p-6 rounded-xl border border-blue-500/30 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm font-medium">Total Orders</p>
                <p className="text-2xl font-bold text-white">{summary.totalOrders.toLocaleString()}</p>
              </div>
              <div className="text-3xl font-bold text-blue-400">Orders</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 p-6 rounded-xl border border-green-500/30 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-200 text-sm font-medium">Total Revenue</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(summary.totalRevenue)}</p>
              </div>
              <div className="text-3xl font-bold text-green-400">Revenue</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 p-6 rounded-xl border border-purple-500/30 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-200 text-sm font-medium">Avg. Order Value</p>
                <p className="text-2xl font-bold text-white">
                  {summary.totalOrders > 0 ? formatCurrency(summary.totalRevenue / summary.totalOrders) : '$0.00'}
                </p>
              </div>
              <div className="text-3xl font-bold text-purple-400">Analytics</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Game Performance Report */}
      <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 p-6 rounded-xl mb-8 border border-gray-700/50 backdrop-blur-sm">
        <div className="flex items-center mb-6">
          <span className="text-lg font-semibold text-blue-400 mr-3">Game:</span>
          <h3 className="text-xl font-bold text-white">Game Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gradient-to-r from-gray-700/80 to-gray-600/80 text-gray-200">
                <th className="p-4 font-medium rounded-tl-lg">Game</th>
                <th className="p-4 font-medium">Total Orders</th>
                <th className="p-4 font-medium">Revenue</th>
                <th className="p-4 font-medium rounded-tr-lg">Avg. Order Value</th>
              </tr>
            </thead>
            <tbody>
              {gameReports.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400">
                    <div className="flex flex-col items-center">
                      <div className="text-lg font-semibold text-green-400 mb-2">Growth</div>
                      <span>No game data available for selected period</span>
                    </div>
                  </td>
                </tr>
              ) : gameReports.map((game, index) => (
                <tr key={index} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors duration-200">
                  <td className="p-4 text-white font-medium">
                    <div className="flex items-center">
                      <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold mr-2">{getGameIcon(game.name)}</span>
                      {game.name}
                    </div>
                  </td>
                  <td className="p-4 text-white">
                    <span className="bg-blue-900/50 px-2 py-1 rounded text-sm">
                      {game.totalOrders.toLocaleString()}
                    </span>
                  </td>
                  <td className="p-4 text-white">
                    <span className="bg-green-900/50 px-2 py-1 rounded text-sm font-medium">
                      {formatCurrency(game.revenue)}
                    </span>
                  </td>
                  <td className="p-4 text-white">
                    <span className="bg-purple-900/50 px-2 py-1 rounded text-sm">
                      {formatCurrency(game.avgOrderValue)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Service Performance Report */}
      <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 p-6 rounded-xl border border-gray-700/50 backdrop-blur-sm">
        <div className="flex items-center mb-6">
          <span className="text-2xl mr-3">⚙️</span>
          <h3 className="text-xl font-bold text-white">Service Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gradient-to-r from-gray-700/80 to-gray-600/80 text-gray-200">
                <th className="p-4 font-medium rounded-tl-lg">Service</th>
                <th className="p-4 font-medium">Total Orders</th>
                <th className="p-4 font-medium">Revenue</th>
                <th className="p-4 font-medium rounded-tr-lg">Completion Rate</th>
              </tr>
            </thead>
            <tbody>
              {serviceReports.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400">
                    <div className="flex flex-col items-center">
                      <span className="text-4xl mb-2">⚙️</span>
                      <span>No service data available for selected period</span>
                    </div>
                  </td>
                </tr>
              ) : serviceReports.map((service, index) => (
                <tr key={index} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors duration-200">
                  <td className="p-4 text-white font-medium">
                    <div className="flex items-center">
                      <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-bold mr-2">{getServiceIcon(service.service)}</span>
                      {service.service}
                    </div>
                  </td>
                  <td className="p-4 text-white">
                    <span className="bg-blue-900/50 px-2 py-1 rounded text-sm">
                      {service.totalOrders.toLocaleString()}
                    </span>
                  </td>
                  <td className="p-4 text-white">
                    <span className="bg-green-900/50 px-2 py-1 rounded text-sm font-medium">
                      {formatCurrency(service.revenue)}
                    </span>
                  </td>
                  <td className="p-4 text-white">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-700 rounded-full h-2 mr-2">
                        <div 
                          className={`h-2 rounded-full ${
                            service.completionRate >= 80 ? 'bg-green-500' :
                            service.completionRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(service.completionRate, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{service.completionRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

const SettingsPage: React.FC = () => (
  <>
    <h2 className="text-3xl font-bold text-white">Settings</h2>
    <p className="text-gray-400 mt-4">Settings page placeholder. Configure admin accounts, payment gateways, and other options here.</p>
  </>
);

// --- Analytics Page Component ---
const AnalyticsPage: React.FC<{ orders: Order[] }> = ({ orders }) => {
  const [timeRange, setTimeRange] = useState('30'); // days
  
  // Calculate analytics data
  const getAnalyticsData = () => {
    const now = new Date();
    const daysAgo = new Date(now.getTime() - parseInt(timeRange) * 24 * 60 * 60 * 1000);
    
    const filteredOrders = orders.filter(order => new Date(order.date) >= daysAgo);
    
    // Calculate revenue excluding cancelled orders
    const totalRevenue = filteredOrders
      .filter(order => order.status !== 'cancelled')
      .reduce((sum, order) => sum + order.price, 0);
    const totalOrders = filteredOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    const statusCounts = filteredOrders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const gameCounts = filteredOrders.reduce((acc, order) => {
      acc[order.game] = (acc[order.game] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Calculate game revenue excluding cancelled orders
    const gameRevenue = filteredOrders
      .filter(order => order.status !== 'cancelled')
      .reduce((acc, order) => {
        acc[order.game] = (acc[order.game] || 0) + order.price;
        return acc;
      }, {} as Record<string, number>);
    
    // New customers analysis
    const customerCounts = filteredOrders.reduce((acc, order) => {
      acc[order.customerName || 'Not Specified'] = (acc[order.customerName || 'Not Specified'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Peak hours analysis (hours of the day)
    const hourlyDistribution = filteredOrders.reduce((acc, order) => {
      const hour = new Date(order.date).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    // Cancellation rate
    const cancelledOrders = statusCounts['cancelled'] || 0;
    const cancellationRate = totalOrders > 0 ? (cancelledOrders / totalOrders * 100) : 0;
    
    // Average completion time (estimate based on completed orders)
    const completedOrders = filteredOrders.filter(order => order.status === 'completed');
    const avgCompletionTime = completedOrders.length > 0 ? '2.5 hours' : 'Not Available';
    
    // Monthly trends analysis
    const monthlyTrends = filteredOrders.reduce((acc, order) => {
      const month = new Date(order.date).toISOString().slice(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = { orders: 0, revenue: 0, cancelled: 0 };
      }
      acc[month].orders++;
      if (order.status !== 'cancelled') {
        acc[month].revenue += order.price;
      }
      if (order.status === 'cancelled') {
        acc[month].cancelled++;
      }
      return acc;
    }, {} as Record<string, { orders: number; revenue: number; cancelled: number }>);
    
    // Response rate (percentage of completed or in-progress orders)
    const activeOrders = (statusCounts['completed'] || 0) + (statusCounts['in_progress'] || 0);
    const responseRate = totalOrders > 0 ? (activeOrders / totalOrders * 100) : 0;
    
    // Profitability analysis by game
    const gameProfitability = Object.entries(gameRevenue).map(([game, revenue]) => {
      const orders = gameCounts[game] || 0;
      const avgValue = orders > 0 ? revenue / orders : 0;
      return { game, revenue, orders, avgValue };
    }).sort((a, b) => b.revenue - a.revenue);
    
    return {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      statusCounts,
      gameCounts,
      gameRevenue,
      customerCounts,
      hourlyDistribution,
      cancellationRate,
      avgCompletionTime,
      completionRate: totalOrders > 0 ? ((statusCounts['completed'] || 0) / totalOrders * 100) : 0,
      monthlyTrends,
      responseRate,
      gameProfitability
    };
  };
  
  const analytics = getAnalyticsData();
  
  return (
    <>
      <header className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Analytics Dashboard</h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </header>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Revenue</p>
              <p className="text-white text-2xl font-bold">${analytics.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="text-blue-200 text-lg font-bold">💰</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-600 to-green-800 p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Orders</p>
              <p className="text-white text-2xl font-bold">{analytics.totalOrders}</p>
            </div>
            <div className="text-green-200 text-lg font-bold">📦</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Average Order Value</p>
              <p className="text-white text-2xl font-bold">${analytics.avgOrderValue.toFixed(2)}</p>
            </div>
            <div className="text-purple-200 text-lg font-bold">📊</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-600 to-orange-800 p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Completion Rate</p>
              <p className="text-white text-2xl font-bold">{analytics.completionRate.toFixed(1)}%</p>
            </div>
            <div className="text-orange-200 text-3xl">✅</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-red-600 to-red-800 p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Cancellation Rate</p>
              <p className="text-white text-2xl font-bold">{analytics.cancellationRate.toFixed(1)}%</p>
            </div>
            <div className="text-red-200 text-3xl">❌</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-teal-600 to-teal-800 p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-100 text-sm font-medium">Average Completion Time</p>
              <p className="text-white text-xl font-bold">{analytics.avgCompletionTime}</p>
            </div>
            <div className="text-teal-200 text-3xl">⏱️</div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm font-medium">Response Rate</p>
              <p className="text-white text-xl font-bold">{analytics.responseRate.toFixed(1)}%</p>
            </div>
            <div className="text-indigo-200 text-3xl">📈</div>
          </div>
        </div>
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Order Status Distribution */}
        <div className="bg-gradient-to-br from-slate-800 to-gray-800 p-6 rounded-2xl border border-slate-700/50 shadow-2xl">
          <h3 className="text-xl font-bold text-white mb-4">Order Status Distribution</h3>
          <div className="space-y-3">
            {Object.entries(analytics.statusCounts).map(([status, count]) => {
              const percentage = analytics.totalOrders > 0 ? (count / analytics.totalOrders * 100) : 0;
              const statusColors = {
                'pending': 'bg-yellow-500',
                'in_progress': 'bg-blue-500',
                'completed': 'bg-green-500',
                'cancelled': 'bg-red-500'
              };
              return (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${statusColors[status as keyof typeof statusColors] || 'bg-gray-500'}`}></div>
                    <span className="text-gray-300">{status}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-slate-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${statusColors[status as keyof typeof statusColors] || 'bg-gray-500'}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-white font-medium w-12 text-right">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Top Games by Orders */}
        <div className="bg-gradient-to-br from-slate-800 to-gray-800 p-6 rounded-2xl border border-slate-700/50 shadow-2xl">
          <h3 className="text-xl font-bold text-white mb-4">Top Games by Orders</h3>
          <div className="space-y-3">
            {Object.entries(analytics.gameCounts)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 5)
              .map(([game, count]) => {
                const percentage = analytics.totalOrders > 0 ? (count / analytics.totalOrders * 100) : 0;
                return (
                  <div key={game} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                      <span className="text-gray-300 truncate max-w-32" title={game}>{game}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-slate-700 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-white font-medium w-12 text-right">{count}</span>
                    </div>
                  </div>
                );
              })
            }
          </div>
        </div>
      </div>
      
      {/* Peak Times and Customer Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Peak Times Analysis */}
        <div className="bg-gradient-to-br from-slate-800 to-gray-800 p-6 rounded-2xl border border-slate-700/50 shadow-2xl">
          <h3 className="text-xl font-bold text-white mb-4">Peak Times (Hours of the Day)</h3>
          <div className="space-y-3">
            {Object.entries(analytics.hourlyDistribution)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 6)
              .map(([hour, count]) => {
                const maxCount = Math.max(...Object.values(analytics.hourlyDistribution));
                const percentage = maxCount > 0 ? (count / maxCount * 100) : 0;
                const hourLabel = `${hour}:00 - ${parseInt(hour) + 1}:00`;
                return (
                  <div key={hour} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500"></div>
                      <span className="text-gray-300">{hourLabel}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-slate-700 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-white font-medium w-12 text-right">{count}</span>
                    </div>
                  </div>
                );
              })
            }
          </div>
        </div>
        
        {/* Top Customers */}
        <div className="bg-gradient-to-br from-slate-800 to-gray-800 p-6 rounded-2xl border border-slate-700/50 shadow-2xl">
          <h3 className="text-xl font-bold text-white mb-4">Top Customers</h3>
          <div className="space-y-3">
            {Object.entries(analytics.customerCounts)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 5)
              .map(([customer, count]) => {
                const percentage = analytics.totalOrders > 0 ? (count / analytics.totalOrders * 100) : 0;
                return (
                  <div key={customer} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded-full bg-gradient-to-r from-pink-500 to-rose-500"></div>
                      <span className="text-gray-300 truncate max-w-32" title={customer}>{customer}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-slate-700 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-white font-medium w-12 text-right">{count}</span>
                    </div>
                  </div>
                );
              })
            }
          </div>
        </div>
      </div>
      
      {/* Revenue by Game */}
      <div className="bg-gradient-to-br from-slate-800 to-gray-800 p-6 rounded-2xl border border-slate-700/50 shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-4">Revenue by Game</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-700/50 text-gray-300">
                <th className="p-4 font-medium">Game</th>
                <th className="p-4 font-medium">Orders</th>
                <th className="p-4 font-medium">Revenue</th>
                <th className="p-4 font-medium">Avg Order Value</th>
                <th className="p-4 font-medium">Share</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(analytics.gameRevenue)
                .sort(([,a], [,b]) => b - a)
                .map(([game, revenue]) => {
                  const orders = analytics.gameCounts[game] || 0;
                  const avgValue = orders > 0 ? revenue / orders : 0;
                  const share = analytics.totalRevenue > 0 ? (revenue / analytics.totalRevenue * 100) : 0;
                  return (
                    <tr key={game} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="p-4 text-white font-medium">{game}</td>
                      <td className="p-4 text-gray-300">{orders}</td>
                      <td className="p-4 text-green-400 font-bold">${revenue.toFixed(2)}</td>
                      <td className="p-4 text-blue-400">${avgValue.toFixed(2)}</td>
                      <td className="p-4 text-purple-400">{share.toFixed(1)}%</td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

const CustomPaymentsPage: React.FC = () => {
  const [customRequests, setCustomRequests] = useState<any[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    customerEmail: '',
    description: '',
    amount: '',
    dueDate: ''
  });
  const [loading, setLoading] = useState(false);

  const loadCustomRequests = async () => {
    try {
      const response = await fetch('/api/admin/custom-payments');
      if (response.ok) {
        const data = await response.json();
        setCustomRequests(data);
      }
    } catch (error) {
      console.error('Failed to load custom payment requests:', error);
    }
  };

  const createCustomRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/admin/custom-payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerEmail: formData.customerEmail,
          description: formData.description,
          amount: parseFloat(formData.amount),
          dueDate: formData.dueDate
        })
      });
      
      if (response.ok) {
        const newRequest = await response.json();
        setCustomRequests(prev => [newRequest, ...prev]);
        setFormData({ customerEmail: '', description: '', amount: '', dueDate: '' });
        setShowCreateForm(false);
        alert('Custom payment request created successfully!');
      } else {
        throw new Error('Failed to create custom payment request');
      }
    } catch (error) {
      console.error('Error creating custom payment request:', error);
      alert('Failed to create custom payment request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyPaymentLink = (requestId: string) => {
    const paymentLink = `${window.location.origin}/pay/custom/${requestId}`;
    navigator.clipboard.writeText(paymentLink);
    alert('Payment link copied to clipboard!');
  };

  const deletePaymentRequest = async (requestId: string, status: string) => {
    if (status === 'paid') {
      alert('Cannot delete paid payment requests.');
      return;
    }

    if (!confirm('Are you sure you want to delete this payment request? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/custom-payments', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: requestId })
      });

      if (response.ok) {
        setCustomRequests(prev => prev.filter(request => request.id !== requestId));
        alert('Payment request deleted successfully!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete payment request');
      }
    } catch (error) {
      console.error('Error deleting payment request:', error);
      alert('Failed to delete payment request. Please try again.');
    }
  };

  useEffect(() => {
    loadCustomRequests();
  }, []);

  return (
    <>
      <header className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-white">Custom Payment Requests</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          {showCreateForm ? 'Cancel' : 'Create New Request'}
        </button>
      </header>

      {showCreateForm && (
        <div className="bg-gradient-to-br from-slate-800 to-gray-800 p-6 rounded-2xl mb-6 border border-slate-700/50 shadow-2xl">
          <h3 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-4">Create Custom Payment Request</h3>
          <form onSubmit={createCustomRequest} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Customer Email</label>
              <input
                type="email"
                value={formData.customerEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                className="w-full bg-slate-600 text-white px-3 py-2 rounded-lg border border-slate-500 focus:border-blue-500 focus:outline-none"
                placeholder="customer@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Amount ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="w-full bg-slate-600 text-white px-3 py-2 rounded-lg border border-slate-500 focus:border-blue-500 focus:outline-none"
                placeholder="0.00"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-slate-600 text-white px-3 py-2 rounded-lg border border-slate-500 focus:border-blue-500 focus:outline-none"
                placeholder="Describe the custom service or request..."
                rows={3}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Due Date (Optional)</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                className="w-full bg-slate-600 text-white px-3 py-2 rounded-lg border border-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300"
              >
                {loading ? 'Creating...' : 'Create Request'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-gradient-to-br from-slate-800 to-gray-800 p-6 rounded-2xl border border-slate-700/50 shadow-2xl">
        <h3 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-4">Payment Requests</h3>
        
        {customRequests.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No custom payment requests yet.</p>
            <p className="text-gray-500 text-sm mt-2">Create your first custom payment request to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-700/50 text-gray-300">
                  <th className="p-4 font-medium">Customer</th>
                  <th className="p-4 font-medium">Description</th>
                  <th className="p-4 font-medium">Amount</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Due Date</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customRequests.map((request) => (
                  <tr key={request.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="p-4 text-white">{request.customerEmail}</td>
                    <td className="p-4 text-white">
                      <div className="max-w-xs truncate" title={request.description}>
                        {request.description}
                      </div>
                    </td>
                    <td className="p-4 text-white font-medium">${request.amount.toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        request.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                        request.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="p-4 text-white">
                      {request.dueDate ? new Date(request.dueDate).toLocaleDateString() : 'No due date'}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyPaymentLink(request.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                        >
                          Copy Link
                        </button>
                        <button
                          onClick={() => deletePaymentRequest(request.id, request.status)}
                          disabled={request.status === 'paid'}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            request.status === 'paid'
                              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                              : 'bg-red-600 hover:bg-red-700 text-white'
                          }`}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

// Manual Orders Component
const ManualOrdersPage: React.FC = () => {
  const [formData, setFormData] = useState({
    customerEmail: '',
    customerName: '',
    game: '',
    service: '',
    price: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/manual-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerEmail: formData.customerEmail,
          customerName: formData.customerName,
          game: formData.game,
          service: formData.service,
          price: parseFloat(formData.price),
          notes: formData.notes
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setMessage(`Order created successfully! Order ID: ${result.orderId}`);
        setMessageType('success');
        setFormData({
          customerEmail: '',
          customerName: '',
          game: '',
          service: '',
          price: '',
          notes: ''
        });
      } else {
        const error = await response.json();
        setMessage(error.error || 'Failed to create order');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error creating manual order:', error);
      setMessage('An error occurred while creating the order');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-white">Manual Order Creation</h2>
      </header>

      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Create Order for Client</h3>
        
        {message && (
          <div className={`mb-4 p-3 rounded ${messageType === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-300 mb-1">
                Customer Email *
              </label>
              <input
                type="email"
                id="customerEmail"
                name="customerEmail"
                value={formData.customerEmail}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="customer@example.com"
              />
            </div>

            <div>
              <label htmlFor="customerName" className="block text-sm font-medium text-gray-300 mb-1">
                Customer Name
              </label>
              <input
                type="text"
                id="customerName"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Customer Name"
              />
            </div>

            <div>
              <label htmlFor="game" className="block text-sm font-medium text-gray-300 mb-1">
                Game *
              </label>
              <select
                id="game"
                name="game"
                value={formData.game}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Game</option>
                <option value="New World">New World</option>
                <option value="Black Desert Online">Black Desert Online</option>
                <option value="War Thunder">War Thunder</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="service" className="block text-sm font-medium text-gray-300 mb-1">
                Service *
              </label>
              <input
                type="text"
                id="service"
                name="service"
                value={formData.service}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Service description"
              />
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-300 mb-1">
                Price (USD) *
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional notes or details..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            {loading ? 'Creating Order...' : 'Create Order'}
          </button>
        </form>
      </div>
    </>
  );
};

const DashboardPage: React.FC<{ onSelectOrder: (id: string) => void; selectedOrderId: string | null; onUpdateOrderStatus: (orderId: string, newStatus: Order['status']) => void; onUpdateOrderDetails: (orderId: string, updates: { status?: Order['status']; price?: number; service?: string }) => void; onNavigateToOrders: () => void; getUnreadCount: (orderId: string) => number; }> = ({ onSelectOrder, selectedOrderId, onUpdateOrderStatus, onUpdateOrderDetails, onNavigateToOrders, getUnreadCount }) => {
  const [stats, setStats] = useState<Stat[]>([
    { title: 'Total Orders', value: '0', change: '0% increase from last month', changeType: 'increase', icon: Icons.orders },
    { title: 'New Orders', value: '0', change: '0 new orders today', changeType: 'increase', icon: Icons.orders },
    { title: 'Completed Orders', value: '0', change: '0% completion rate', changeType: 'increase', icon: Icons.orders },
    { title: 'Cancelled Orders', value: '0', change: '0 cancelled orders', changeType: 'decrease', icon: Icons.orders },
    { title: 'Total Revenue', value: '$0', change: '0% increase from last month', changeType: 'increase', icon: Icons.revenue },
  ]);
  const { orders } = useOrders();
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      // Load real statistics from API
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        
        setStats([
          { 
            title: 'Total Orders', 
            value: data.totalOrders.value.toString(), 
            change: `${data.totalOrders.change}% increase from last month`, 
            changeType: data.totalOrders.change >= 0 ? 'increase' : 'decrease',
            icon: Icons.orders 
          },
          { 
            title: 'New Orders', 
            value: data.pendingOrders.value.toString(), 
            change: `${data.pendingOrders.value} pending orders`, 
            changeType: 'increase',
            icon: Icons.orders 
          },
          { 
            title: 'Completed Orders', 
            value: data.completedOrders.value.toString(), 
            change: `${data.completedOrders.change}% completion rate`, 
            changeType: data.completedOrders.change >= 0 ? 'increase' : 'decrease',
            icon: Icons.orders 
          },
          { 
            title: 'Cancelled Orders', 
            value: data.cancelledOrders.value.toString(), 
            change: `${data.cancelledOrders.value} cancelled orders`, 
            changeType: 'decrease',
            icon: Icons.orders 
          },
          { 
            title: 'Total Revenue', 
            value: `$${data.totalRevenue.value.toLocaleString()}`, 
            change: `${data.totalRevenue.change}% increase from last month`, 
            changeType: data.totalRevenue.change >= 0 ? 'increase' : 'decrease',
            icon: Icons.revenue 
          },
        ]);
      } else {
        // Fallback to placeholder data if API fails
        const placeholderData = {
          totalOrders: { value: 0, change: 0 },
          pendingOrders: { value: 0 },
          completedOrders: { value: 0, change: 0 },
          cancelledOrders: { value: 0 },
          totalRevenue: { value: 0, change: 0 }
        };
        
        setStats([
          { 
            title: 'Total Orders', 
            value: placeholderData.totalOrders.value.toString(), 
            change: `${placeholderData.totalOrders.change}% increase from last month`, 
            changeType: 'increase',
            icon: Icons.orders 
          },
          { 
            title: 'New Orders', 
            value: placeholderData.pendingOrders.value.toString(), 
            change: `${placeholderData.pendingOrders.value} pending orders`, 
            changeType: 'increase',
            icon: Icons.orders 
          },
          { 
            title: 'Completed Orders', 
            value: placeholderData.completedOrders.value.toString(), 
            change: `${placeholderData.completedOrders.change}% completion rate`, 
            changeType: 'increase',
            icon: Icons.orders 
          },
          { 
            title: 'Cancelled Orders', 
            value: placeholderData.cancelledOrders.value.toString(), 
            change: `${placeholderData.cancelledOrders.value} cancelled orders`, 
            changeType: 'decrease',
            icon: Icons.orders 
          },
          { 
            title: 'Total Revenue', 
            value: `$${placeholderData.totalRevenue.value.toLocaleString()}`, 
            change: `${placeholderData.totalRevenue.change}% increase from last month`, 
            changeType: 'increase',
            icon: Icons.revenue 
          },
        ]);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentOrders = async () => {
    try {
      const response = await fetch('/api/admin/orders');
      if (response.ok) {
        const data = await response.json();
        // Get the 5 most recent orders
        setRecentOrders(data.slice(0, 5));
      } else {
        console.error('Failed to load recent orders');
      }
    } catch (error) {
      console.error('Error loading recent orders:', error);
    }
  };

  useEffect(() => {
    loadStats();
    loadRecentOrders();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-4 text-white">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <>
      <header className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-white">Welcome to the Admin Dashboard</h2>
        <NotificationCenter className="" />
      </header>
      

      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {stats.map(stat => <StatCard key={stat.title} stat={stat} onNavigateToOrders={onNavigateToOrders} />)}
      </div>
      <RecentOrdersTable orders={recentOrders} selectedOrderId={selectedOrderId} onSelectOrder={onSelectOrder} getUnreadCount={getUnreadCount} />
    </>
  );
};

const OrdersPage: React.FC<{ onSelectOrder: (id: string) => void; selectedOrderId: string | null; onUpdateOrderStatus: (orderId: string, newStatus: Order['status']) => void; onUpdateOrderDetails: (orderId: string, updates: { status?: Order['status']; price?: number; service?: string; notes?: string }) => void; onAddPriceChange?: (orderId: string, oldPrice: number, newPrice: number, reason: string) => Promise<void>; getUnreadCount: (orderId: string) => number; }> = ({ onSelectOrder, selectedOrderId, onUpdateOrderStatus, onUpdateOrderDetails, onAddPriceChange, getUnreadCount }) => {
  const { orders } = useOrders();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [gameFilter, setGameFilter] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Filter orders based on search criteria
  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchTerm || 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.game.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || order.status === statusFilter;
    const matchesGame = !gameFilter || order.game.toLowerCase().includes(gameFilter.toLowerCase());
    
    const orderPrice = order.price;
    const matchesMinPrice = !minPrice || orderPrice >= parseFloat(minPrice);
    const matchesMaxPrice = !maxPrice || orderPrice <= parseFloat(maxPrice);
    
    return matchesSearch && matchesStatus && matchesGame && matchesMinPrice && matchesMaxPrice;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setGameFilter('');
    setMinPrice('');
    setMaxPrice('');
  };

  return (
    <>
      <header className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-white">All Orders</h2>
        <NotificationCenter className="" />
      </header>
      
      <SearchAndFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        gameFilter={gameFilter}
        setGameFilter={setGameFilter}
        minPrice={minPrice}
        setMinPrice={setMinPrice}
        maxPrice={maxPrice}
        setMaxPrice={setMaxPrice}
        onClearFilters={clearFilters}
      />
      
      <OrdersTable 
        orders={orders} 
        filteredOrders={filteredOrders}
        selectedOrderId={selectedOrderId} 
        onSelectOrder={onSelectOrder} 
        onUpdateOrderStatus={onUpdateOrderStatus} 
        onUpdateOrderDetails={onUpdateOrderDetails} 
        onAddPriceChange={onAddPriceChange} 
        getUnreadCount={getUnreadCount}
      />
    </>
  );
};

const AdminPanel: React.FC = () => {
  const router = useRouter();
  const [activePage, setActivePage] = useState('Dashboard');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [priceChanges, setPriceChanges] = useState<PriceChange[]>([]);
  const { orders, updateOrderStatus, updateOrderDetails } = useOrders();
  const { user } = useUser();
  const { getUnreadCount, markAsRead } = useUnreadCounts();

  // Load price changes from database
  const loadPriceChanges = async () => {
    try {
      const response = await fetch('/api/admin/price-changes', {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const dbPriceChanges = await response.json();
        // Convert to the format expected by the frontend
        const formattedChanges: PriceChange[] = dbPriceChanges.map((change: any) => ({
          id: change.id,
          orderId: change.orderId,
          oldPrice: change.oldPrice,
          newPrice: change.newPrice,
          reason: change.reason,
          changedBy: change.changedBy,
          changeDate: change.createdAt
        }));
        setPriceChanges(formattedChanges);
      }
    } catch (error) {
      console.error('Failed to load price changes:', error);
    }
  };

  // Load price changes when component mounts and user is available
  useEffect(() => {
    if (user?.id) {
      loadPriceChanges();
    }
  }, [user?.id]);

  const addPriceChange = async (orderId: string, oldPrice: number, newPrice: number, reason: string) => {
    try {
      // First update the actual order price in the database
      await updateOrderDetails(orderId, { price: newPrice });
      
      // Then save the price change to the database
      const response = await fetch('/api/admin/price-changes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId,
          oldPrice,
          newPrice,
          reason
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save price change');
      }
      
      const savedPriceChange = await response.json();
      
      // Convert to the format expected by the frontend
      const newChange: PriceChange = {
        id: savedPriceChange.id,
        orderId: savedPriceChange.orderId,
        oldPrice: savedPriceChange.oldPrice,
        newPrice: savedPriceChange.newPrice,
        reason: savedPriceChange.reason,
        changedBy: savedPriceChange.changedBy,
        changeDate: savedPriceChange.createdAt
      };
      
      setPriceChanges(prev => [newChange, ...prev]);
    } catch (error) {
      console.error('Failed to update price:', error);
      alert('Failed to update price. Please try again.');
    }
  };

  const deletePriceChange = async (id: string, deleteReason: string) => {
    try {
      const response = await fetch(`/api/admin/price-changes?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          deleteReason
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Delete API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(errorData.error || `Failed to delete price change (${response.status})`);
      }
      
      const result = await response.json();
      console.log('Delete successful:', result);
      
      // Remove the price change from the local state
      setPriceChanges(prev => prev.filter(change => change.id !== id));
    } catch (error) {
      console.error('Failed to delete price change:', error);
      throw error;
    }
  };

  const renderMainContent = () => {
    switch (activePage) {
      case 'Dashboard':
        return <DashboardPage onSelectOrder={setSelectedOrderId} selectedOrderId={selectedOrderId} onUpdateOrderStatus={updateOrderStatus} onUpdateOrderDetails={updateOrderDetails} onNavigateToOrders={() => setActivePage('Manage Orders')} getUnreadCount={getUnreadCount} />;
      case 'Manage Orders':
        return (
          <>
            <OrdersPage onSelectOrder={setSelectedOrderId} selectedOrderId={selectedOrderId} onUpdateOrderStatus={updateOrderStatus} onUpdateOrderDetails={updateOrderDetails} onAddPriceChange={addPriceChange} getUnreadCount={getUnreadCount} />
            <PriceChangesTable priceChanges={priceChanges} orders={orders} onAddPriceChange={addPriceChange} onDeletePriceChange={deletePriceChange} />
          </>
        );
      case 'Manage Users':
        return <CustomersPage orders={orders} />;
      case 'Reports':
        return <GamesPage />;
      case 'Analytics':
        return <AnalyticsPage orders={orders} />;
      case 'Settings':
        return <SettingsPage />;
      case 'Custom Payments':
        return <CustomPaymentsPage />;
      case 'Manual Orders':
        return <ManualOrdersPage />;
      default:
        return <DashboardPage onSelectOrder={setSelectedOrderId} selectedOrderId={selectedOrderId} onUpdateOrderStatus={updateOrderStatus} onUpdateOrderDetails={updateOrderDetails} onNavigateToOrders={() => setActivePage('Manage Orders')} getUnreadCount={getUnreadCount} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <div className="flex-1 flex" style={{ marginLeft: '16rem' }}>
        <main id="main-content" className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {renderMainContent()}
          </div>
        </main>
        <ChatPanel selectedOrderId={selectedOrderId} />
      </div>
    </div>
  );
};

export default function ProtectedAdminPage() {
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user === null) return;
    if (!user || user.role !== 'ADMIN') {
      router.replace('/');
    }
  }, [user, router]);

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return <AdminPanel />;
}