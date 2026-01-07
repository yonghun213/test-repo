'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import dynamic from 'next/dynamic';

const PriceHistoryViewer = dynamic(() => import('@/components/PriceHistoryViewer'), { ssr: false });

interface IngredientMaster {
  id: string;
  category: string;
  koreanName: string;
  englishName: string;
  quantity: number;
  unit: string;
  yieldRate: number;
}

interface TemplateItem {
  id: string;
  templateId: string;
  ingredientId: string;
  category: string | null;
  koreanName: string | null;
  englishName: string | null;
  quantity: number | null;
  unit: string | null;
  yieldRate: number | null;
  price: number;
  currency: string;
  notes: string | null;
  ingredient: IngredientMaster;
}

interface IngredientTemplate {
  id: string;
  name: string;
  country: string | null;
  description: string | null;
  storeIds: string | null;
  isActive: boolean;
  items?: TemplateItem[];
}

interface Store {
  id: string;
  tempName: string | null;
  officialName: string | null;
  country: string;
}

const CATEGORIES = [
  'Oil', 'Raw chicken', 'Sauce', 'Powder', 'Dry goods', 'Food', 'Produced'
];

const UNITS = ['g', 'ml', 'ea', 'pcs', 'kg', 'L', 'lb', 'oz'];

const CURRENCIES = [
  { code: 'CAD', symbol: '$', name: 'Canadian Dollar' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
  { code: 'COP', symbol: '$', name: 'Colombian Peso' },
  { code: 'KRW', symbol: '₩', name: 'Korean Won' },
];

export default function PricingPage() {
  const { data: session, status } = useSession();
  
  const [activeView, setActiveView] = useState<'templates' | 'history'>('templates');
  const [templates, setTemplates] = useState<IngredientTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<IngredientTemplate | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [showAddIngredient, setShowAddIngredient] = useState(false);
  
  const [newTemplate, setNewTemplate] = useState({
    name: '', country: '', description: '', storeIds: [] as string[], currency: 'CAD'
  });
  
  const [newIngredient, setNewIngredient] = useState({
    category: 'Food', koreanName: '', englishName: '', quantity: 0, unit: 'g', yieldRate: 99
  });

  const [editedItems, setEditedItems] = useState<Map<string, Partial<TemplateItem>>>(new Map());
  
  // 모든 템플릿 적용 확인 모달 상태
  const [showApplyAllModal, setShowApplyAllModal] = useState(false);
  const [pendingMasterChanges, setPendingMasterChanges] = useState<Array<{itemId: string; fields: Partial<TemplateItem>}>>([]);
  const [pendingPriceChanges, setPendingPriceChanges] = useState<Array<{itemId: string; fields: Partial<TemplateItem>}>>([]);

  useEffect(() => {
    if (status === 'unauthenticated') redirect('/login');
  }, [status]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [templatesRes, storesRes] = await Promise.all([
          fetch('/api/ingredient-templates'),
          fetch('/api/stores')
        ]);
        
        if (templatesRes.ok) {
          const data = await templatesRes.json();
          setTemplates(data);
          if (data.length > 0 && !selectedTemplateId) setSelectedTemplateId(data[0].id);
        }
        
        if (storesRes.ok) {
          const data = await storesRes.json();
          setStores(data.stores || data);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const loadTemplate = async () => {
      if (!selectedTemplateId) return;
      try {
        const res = await fetch(`/api/ingredient-templates/${selectedTemplateId}`);
        if (res.ok) {
          setSelectedTemplate(await res.json());
          setEditedItems(new Map());
        }
      } catch (error) {
        console.error('Failed to load template:', error);
      }
    };
    loadTemplate();
  }, [selectedTemplateId]);

  const filteredItems = useMemo(() => {
    if (!selectedTemplate?.items) return [];
    return selectedTemplate.items.filter(item => {
      const effectiveCategory = item.category || item.ingredient.category;
      const effectiveKoreanName = item.koreanName || item.ingredient.koreanName;
      const effectiveEnglishName = item.englishName || item.ingredient.englishName;
      const matchesCategory = categoryFilter === 'all' || effectiveCategory === categoryFilter;
      const matchesSearch = !searchTerm || 
        effectiveKoreanName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        effectiveEnglishName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedTemplate?.items, categoryFilter, searchTerm]);

  const getEffectiveValue = (item: TemplateItem, field: keyof TemplateItem) => {
    const edited = editedItems.get(item.id);
    if (edited && edited[field] !== undefined) return edited[field];
    if (item[field] !== null && item[field] !== undefined) return item[field];
    return (item.ingredient as any)[field];
  };

  const handleItemEdit = (itemId: string, field: string, value: any) => {
    setEditedItems(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(itemId) || {};
      newMap.set(itemId, { ...existing, [field]: value });
      return newMap;
    });
  };

  const saveEdits = async () => {
    if (editedItems.size === 0) return;
    
    // 변경사항 분류: 마스터 필드(이름, 수량, 단위, 수율) vs 가격 필드
    const masterFields = ['category', 'koreanName', 'englishName', 'quantity', 'unit', 'yieldRate'];
    const priceFields = ['price', 'currency', 'notes'];
    
    const masterChanges: Array<{itemId: string; fields: Partial<TemplateItem>}> = [];
    const priceChanges: Array<{itemId: string; fields: Partial<TemplateItem>}> = [];
    
    editedItems.forEach((fields, itemId) => {
      const hasMasterChange = Object.keys(fields).some(key => masterFields.includes(key));
      const hasPriceChange = Object.keys(fields).some(key => priceFields.includes(key));
      
      if (hasMasterChange) {
        // 마스터 필드와 가격 필드 분리
        const masterFieldsOnly: Partial<TemplateItem> = {};
        const priceFieldsOnly: Partial<TemplateItem> = {};
        
        Object.entries(fields).forEach(([key, value]) => {
          if (masterFields.includes(key)) {
            (masterFieldsOnly as any)[key] = value;
          } else if (priceFields.includes(key)) {
            (priceFieldsOnly as any)[key] = value;
          }
        });
        
        if (Object.keys(masterFieldsOnly).length > 0) {
          masterChanges.push({ itemId, fields: masterFieldsOnly });
        }
        if (Object.keys(priceFieldsOnly).length > 0) {
          priceChanges.push({ itemId, fields: priceFieldsOnly });
        }
      } else if (hasPriceChange) {
        priceChanges.push({ itemId, fields });
      }
    });
    
    // 마스터 필드 변경이 있으면 확인 모달 표시
    if (masterChanges.length > 0) {
      setPendingMasterChanges(masterChanges);
      setPendingPriceChanges(priceChanges);
      setShowApplyAllModal(true);
      return;
    }
    
    // 가격 변경만 있으면 바로 저장 (이 템플릿만 적용)
    await executeChanges([], priceChanges, false);
  };
  
  // 실제 저장 실행
  const executeChanges = async (
    masterChanges: Array<{itemId: string; fields: Partial<TemplateItem>}>,
    priceChanges: Array<{itemId: string; fields: Partial<TemplateItem>}>,
    applyToAll: boolean
  ) => {
    setSaving(true);
    try {
      let successCount = 0;
      let costVersionsRecalculated = 0;
      
      // 마스터 변경 처리 (개별 API 호출로 applyToAll 옵션 사용)
      for (const change of masterChanges) {
        const res = await fetch(`/api/ingredient-templates/${selectedTemplateId}/items/${change.itemId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...change.fields, applyToAll })
        });
        
        if (res.ok) {
          const result = await res.json();
          successCount++;
          costVersionsRecalculated += result.updates?.costVersionsRecalculated || 0;
        }
      }
      
      // 가격 변경 처리 (개별 API 호출, applyToAll = false)
      for (const change of priceChanges) {
        const res = await fetch(`/api/ingredient-templates/${selectedTemplateId}/items/${change.itemId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...change.fields, applyToAll: false })
        });
        
        if (res.ok) {
          const result = await res.json();
          successCount++;
          costVersionsRecalculated += result.updates?.costVersionsRecalculated || 0;
        }
      }
      
      // 템플릿 다시 로드
      const templateRes = await fetch(`/api/ingredient-templates/${selectedTemplateId}`);
      if (templateRes.ok) setSelectedTemplate(await templateRes.json());
      setEditedItems(new Map());
      
      let message = `${successCount}개 항목이 저장되었습니다.`;
      if (applyToAll) {
        message += ' (모든 템플릿에 적용됨)';
      }
      if (costVersionsRecalculated > 0) {
        message += ` ${costVersionsRecalculated}개 원가 버전이 재계산되었습니다.`;
      }
      alert(message);
    } catch (error) {
      console.error('Failed to save:', error);
      alert('저장 실패');
    } finally {
      setSaving(false);
      setShowApplyAllModal(false);
      setPendingMasterChanges([]);
      setPendingPriceChanges([]);
    }
  };

  const createTemplate = async () => {
    if (!newTemplate.name) { alert('템플레이트 이름을 입력하세요'); return; }
    try {
      const res = await fetch('/api/ingredient-templates', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate)
      });
      if (res.ok) {
        const template = await res.json();
        setTemplates(prev => [...prev, template]);
        setSelectedTemplateId(template.id);
        setShowCreateTemplate(false);
        setNewTemplate({ name: '', country: '', description: '', storeIds: [], currency: 'CAD' });
      }
    } catch (error) {
      console.error('Failed to create template:', error);
      alert('템플레이트 생성 실패');
    }
  };

  const addIngredient = async () => {
    if (!newIngredient.koreanName || !newIngredient.englishName) {
      alert('한글명과 영문명을 입력하세요'); return;
    }
    try {
      const res = await fetch('/api/ingredients', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIngredient)
      });
      if (res.ok) {
        const templateRes = await fetch(`/api/ingredient-templates/${selectedTemplateId}`);
        if (templateRes.ok) setSelectedTemplate(await templateRes.json());
        setShowAddIngredient(false);
        setNewIngredient({ category: 'Food', koreanName: '', englishName: '', quantity: 0, unit: 'g', yieldRate: 99 });
        alert('식재료가 추가되었습니다 (모든 템플레이트에 자동 추가됨)');
      }
    } catch (error) {
      console.error('Failed to add ingredient:', error);
      alert('식재료 추가 실패');
    }
  };

  const categoryCounts = useMemo(() => {
    if (!selectedTemplate?.items) return {};
    const counts: Record<string, number> = {};
    selectedTemplate.items.forEach(item => {
      const cat = item.category || item.ingredient.category;
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [selectedTemplate?.items]);

  if (loading || status === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">식재료 관리</h1>
          <p className="text-gray-500 mt-1">Ingredient & Template Management</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowAddIngredient(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            식재료 추가
          </button>
          <button onClick={() => setShowCreateTemplate(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            템플레이트 생성
          </button>
        </div>
      </div>

      {/* View Toggle Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveView('templates')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${
              activeView === 'templates'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            템플레이트 관리
          </button>
          <button
            onClick={() => setActiveView('history')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${
              activeView === 'history'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            가격 히스토리
          </button>
        </nav>
      </div>

      {activeView === 'history' ? (
        <PriceHistoryViewer />
      ) : (
        <>
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">템플레이트 선택</label>
            <select
              value={selectedTemplateId || ''}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="" disabled>템플레이트를 선택하세요...</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name} {template.country && `(${template.country})`}
                </option>
              ))}
            </select>
            {templates.length === 0 && <p className="text-gray-500 text-sm mt-1">템플레이트가 없습니다. 먼저 데이터베이스를 마이그레이션하고 시드하세요.</p>}
          </div>
          {selectedTemplate && (
            <div className="text-right text-sm text-gray-500">
              <div>총 {selectedTemplate.items?.length || 0}개 식재료</div>
              {selectedTemplate.description && <div className="text-xs">{selectedTemplate.description}</div>}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="식재료 검색 (한글/영문)..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setCategoryFilter('all')} className={`px-3 py-1.5 rounded-full text-sm ${categoryFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              전체 ({selectedTemplate?.items?.length || 0})
            </button>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategoryFilter(cat)} className={`px-3 py-1.5 rounded-full text-sm ${categoryFilter === cat ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                {cat} ({categoryCounts[cat] || 0})
              </button>
            ))}
          </div>
        </div>
      </div>

      {editedItems.size > 0 && (
        <div className="sticky top-0 z-10 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-yellow-800"><strong>{editedItems.size}개</strong> 항목이 수정되었습니다</span>
          <button onClick={saveEdits} disabled={saving} className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50">
            {saving ? '저장 중...' : '변경사항 저장'}
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">카테고리</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">한글명</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">영문명</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">수량</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">단위</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">수율(%)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">금액</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">화폐</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => {
                const isEdited = editedItems.has(item.id);
                return (
                  <tr key={item.id} className={isEdited ? 'bg-yellow-50' : 'hover:bg-gray-50'}>
                    <td className="px-4 py-2">
                      <select value={getEffectiveValue(item, 'category') as string} onChange={(e) => handleItemEdit(item.id, 'category', e.target.value)}
                        className="w-full border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500">
                        {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <input type="text" value={getEffectiveValue(item, 'koreanName') as string} onChange={(e) => handleItemEdit(item.id, 'koreanName', e.target.value)}
                        className="w-full border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500" />
                    </td>
                    <td className="px-4 py-2">
                      <input type="text" value={getEffectiveValue(item, 'englishName') as string} onChange={(e) => handleItemEdit(item.id, 'englishName', e.target.value)}
                        className="w-full border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500" />
                    </td>
                    <td className="px-4 py-2">
                      <input type="number" value={getEffectiveValue(item, 'quantity') as number} onChange={(e) => handleItemEdit(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500" />
                    </td>
                    <td className="px-4 py-2">
                      <select value={getEffectiveValue(item, 'unit') as string} onChange={(e) => handleItemEdit(item.id, 'unit', e.target.value)}
                        className="w-full border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500">
                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <input type="number" value={getEffectiveValue(item, 'yieldRate') as number} onChange={(e) => handleItemEdit(item.id, 'yieldRate', parseFloat(e.target.value) || 0)}
                        min="0" max="100" className="w-full border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500" />
                    </td>
                    <td className="px-4 py-2">
                      <input type="number" value={editedItems.get(item.id)?.price ?? item.price} onChange={(e) => handleItemEdit(item.id, 'price', parseFloat(e.target.value) || 0)}
                        step="0.01" className="w-full border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500" />
                    </td>
                    <td className="px-4 py-2">
                      <select value={editedItems.get(item.id)?.currency ?? item.currency} onChange={(e) => handleItemEdit(item.id, 'currency', e.target.value)}
                        className="w-full border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500">
                        {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
              {filteredItems.length === 0 && (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                  {searchTerm || categoryFilter !== 'all' ? '검색 결과가 없습니다' : '식재료 데이터가 없습니다. 먼저 데이터베이스를 시드하세요.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-gray-50 border-t flex justify-between items-center">
          <span className="text-sm text-gray-500">{filteredItems.length}개 항목 표시</span>
        </div>
      </div>

      {showCreateTemplate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold mb-4">새 템플레이트 생성</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">템플레이트 이름 *</label>
                <input type="text" value={newTemplate.name} onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))} placeholder="예: Mexico, Colombia, USA..."
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">국가 코드</label>
                <input type="text" value={newTemplate.country} onChange={(e) => setNewTemplate(prev => ({ ...prev, country: e.target.value.toUpperCase() }))} placeholder="예: MX, CO, CA, US..." maxLength={2}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">기본 화폐</label>
                <select value={newTemplate.currency} onChange={(e) => setNewTemplate(prev => ({ ...prev, currency: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500">
                  {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <textarea value={newTemplate.description} onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))} placeholder="템플레이트에 대한 설명..." rows={2}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
              </div>
              {stores.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">적용 매장</label>
                  <div className="max-h-32 overflow-y-auto border rounded-lg p-2 space-y-1">
                    {stores.map(store => (
                      <label key={store.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                        <input type="checkbox" checked={newTemplate.storeIds.includes(store.id)} onChange={(e) => {
                          setNewTemplate(prev => ({
                            ...prev, storeIds: e.target.checked ? [...prev.storeIds, store.id] : prev.storeIds.filter(id => id !== store.id)
                          }));
                        }} className="rounded text-blue-600" />
                        <span className="text-sm">{store.officialName || store.tempName}</span>
                        <span className="text-xs text-gray-400">({store.country})</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowCreateTemplate(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">취소</button>
              <button onClick={createTemplate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">생성</button>
            </div>
          </div>
        </div>
      )}

      {showAddIngredient && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold mb-4">새 식재료 추가</h2>
            <p className="text-sm text-gray-500 mb-4">새로 추가된 식재료는 모든 템플레이트에 자동으로 추가됩니다.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">카테고리 *</label>
                <select value={newIngredient.category} onChange={(e) => setNewIngredient(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500">
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">한글명 *</label>
                  <input type="text" value={newIngredient.koreanName} onChange={(e) => setNewIngredient(prev => ({ ...prev, koreanName: e.target.value }))} placeholder="예: 카놀라유"
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">영문명 *</label>
                  <input type="text" value={newIngredient.englishName} onChange={(e) => setNewIngredient(prev => ({ ...prev, englishName: e.target.value }))} placeholder="예: Canola oil"
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">수량</label>
                  <input type="number" value={newIngredient.quantity} onChange={(e) => setNewIngredient(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">단위</label>
                  <select value={newIngredient.unit} onChange={(e) => setNewIngredient(prev => ({ ...prev, unit: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500">
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">수율 (%)</label>
                  <input type="number" value={newIngredient.yieldRate} onChange={(e) => setNewIngredient(prev => ({ ...prev, yieldRate: parseFloat(e.target.value) || 0 }))}
                    min="0" max="100" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowAddIngredient(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">취소</button>
              <button onClick={addIngredient} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">추가</button>
            </div>
          </div>
        </div>
      )}

      {/* 모든 템플릿 적용 확인 모달 */}
      {showApplyAllModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">모든 템플릿에 적용하시겠습니까?</h3>
              <p className="text-sm text-gray-500">
                이름, 수량, 단위, 수율 등의 변경사항이 있습니다.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">변경 항목 ({pendingMasterChanges.length}개)</h4>
              <ul className="text-sm text-gray-600 space-y-1 max-h-32 overflow-y-auto">
                {pendingMasterChanges.map((change, idx) => {
                  const item = selectedTemplate?.items?.find(i => i.id === change.itemId);
                  const effectiveName = item?.koreanName || item?.ingredient.koreanName || '알 수 없음';
                  return (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                      <span>{effectiveName}</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-gray-500 text-xs">
                        {Object.keys(change.fields).join(', ')} 변경
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => executeChanges(pendingMasterChanges, pendingPriceChanges, true)}
                disabled={saving}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {saving ? '저장 중...' : '✓ 예, 모든 템플릿에 적용'}
              </button>
              <button
                onClick={() => executeChanges(pendingMasterChanges, pendingPriceChanges, false)}
                disabled={saving}
                className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 font-medium"
              >
                {saving ? '저장 중...' : '이 템플릿에만 적용'}
              </button>
              <button
                onClick={() => {
                  setShowApplyAllModal(false);
                  setPendingMasterChanges([]);
                  setPendingPriceChanges([]);
                }}
                disabled={saving}
                className="w-full px-4 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                취소
              </button>
            </div>
            
            <div className="mt-4 text-xs text-gray-400 text-center">
              <p>• <strong>모든 템플릿에 적용</strong>: 마스터 데이터가 수정되며, 이 식재료를 사용하는 모든 매뉴얼도 업데이트됩니다.</p>
              <p>• <strong>이 템플릿에만 적용</strong>: 현재 템플릿에서만 오버라이드됩니다.</p>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
