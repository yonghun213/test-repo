'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { 
  Package, Plus, Search, Filter, Download, Upload, 
  TrendingUp, TrendingDown, AlertTriangle, RefreshCw,
  Calendar, FileSpreadsheet, BarChart3
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Ingredient {
  id: string;
  category: string;
  koreanName: string;
  englishName: string;
  quantity: number;
  unit: string;
  yieldRate: number;
}

interface InventoryItem {
  id: string;
  ingredientId: string;
  ingredient: Ingredient;
  beginningQty: number;
  receivedQty: number;
  theoreticalUsage: number;
  actualUsage: number;
  endingQty: number;
  variance: number;
  variancePercent: number;
  status: string;
}

type TabType = 'inventory' | 'receiving' | 'count' | 'analysis';

export default function InventoryPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<TabType>('inventory');
  const [loading, setLoading] = useState(true);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStore, setSelectedStore] = useState('');
  const [stores, setStores] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') redirect('/login');
  }, [status]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch ingredients
      const ingredientsRes = await fetch('/api/ingredients');
      if (ingredientsRes.ok) {
        const data = await ingredientsRes.json();
        setIngredients(data);
        
        // Extract categories
        const cats = [...new Set(data.map((i: Ingredient) => i.category))];
        setCategories(cats as string[]);
        
        // Create inventory data from ingredients
        const invData = data.map((ing: Ingredient) => ({
          id: `inv_${ing.id}`,
          ingredientId: ing.id,
          ingredient: ing,
          beginningQty: 0,
          receivedQty: 0,
          theoreticalUsage: 0,
          actualUsage: 0,
          endingQty: 0,
          variance: 0,
          variancePercent: 0,
          status: 'PENDING'
        }));
        setInventoryData(invData);
      }
      
      // Fetch stores
      const storesRes = await fetch('/api/stores');
      if (storesRes.ok) {
        const data = await storesRes.json();
        setStores(data.stores || data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const filteredInventory = inventoryData.filter(item => {
    const matchesSearch = 
      item.ingredient.englishName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ingredient.koreanName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.ingredient.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const tabs = [
    { id: 'inventory' as TabType, name: 'Inventory', icon: Package },
    { id: 'receiving' as TabType, name: 'Receiving', icon: Download },
    { id: 'count' as TabType, name: 'Count History', icon: Calendar },
    { id: 'analysis' as TabType, name: 'Analysis', icon: BarChart3 },
  ];

  if (loading || status === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-7 h-7 text-orange-500" />
            Inventory Management
          </h1>
          <p className="text-gray-500 mt-1">재고 관리 - 입고, 실사, 분석</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Select Store</option>
            {stores.map((store: any) => (
              <option key={store.id} value={store.id}>
                {store.officialName || store.tempName}
              </option>
            ))}
          </select>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{ingredients.length}</p>
            </div>
            <Package className="w-10 h-10 text-blue-500 opacity-50" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Categories</p>
              <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
            </div>
            <Filter className="w-10 h-10 text-green-500 opacity-50" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Low Stock</p>
              <p className="text-2xl font-bold text-orange-600">0</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-orange-500 opacity-50" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Variance Alert</p>
              <p className="text-2xl font-bold text-red-600">0</p>
            </div>
            <TrendingDown className="w-10 h-10 text-red-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search ingredients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <button
          onClick={fetchData}
          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Korean Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">English Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Beginning</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Received</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ending</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Variance</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      No inventory data found. Select a store and import data.
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs">{item.ingredient.category}</span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.ingredient.koreanName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.ingredient.englishName}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{item.ingredient.unit}</td>
                      <td className="px-4 py-3 text-sm text-right">{item.beginningQty}</td>
                      <td className="px-4 py-3 text-sm text-right">{item.receivedQty}</td>
                      <td className="px-4 py-3 text-sm text-right">{item.endingQty}</td>
                      <td className="px-4 py-3 text-sm text-right">
                        <span className={`${item.variance < 0 ? 'text-red-600' : item.variance > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                          {item.variance}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'receiving' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <Download className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Receiving Records</h3>
            <p className="text-gray-500 mb-4">Track all incoming inventory deliveries</p>
            <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2 mx-auto">
              <Plus className="w-4 h-4" />
              New Receiving Entry
            </button>
          </div>
        </div>
      )}

      {activeTab === 'count' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Count History</h3>
            <p className="text-gray-500 mb-4">View past inventory counts and audits</p>
            <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2 mx-auto">
              <Plus className="w-4 h-4" />
              Start New Count
            </button>
          </div>
        </div>
      )}

      {activeTab === 'analysis' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Inventory Analysis</h3>
            <p className="text-gray-500 mb-4">Variance reports and consumption trends</p>
            <p className="text-sm text-gray-400">Select a store and time period to view analysis</p>
          </div>
        </div>
      )}
    </div>
  );
}
