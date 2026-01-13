
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

// 타입 정의 (실제로는 별도 파일로 분리하는 것이 좋음)
interface InventoryGroup {
  id: string;
  name: string;
  _count: { periods: number };
}

interface InventoryPeriod {
  id: string;
  startDate: string;
  endDate: string;
  status: string;
  notes: string;
  _count: { items: number };
}

export default function InventoryDashboardPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<InventoryGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [periods, setPeriods] = useState<InventoryPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. 초기 로딩: 그룹 목록 가져오기
  useEffect(() => {
    fetchGroups();
  }, []);

  // 2. 그룹 선택 시: 해당 그룹의 기간 목록 가져오기
  useEffect(() => {
    if (selectedGroupId) {
      fetchPeriods(selectedGroupId);
    } else {
      setPeriods([]);
    }
  }, [selectedGroupId]);

  const fetchGroups = async () => {
    try {
<<<<<<< HEAD
      // Fetch ingredients (API returns { ingredients, categories })
      const ingredientsRes = await fetch('/api/ingredients');
      if (ingredientsRes.ok) {
        const data = await ingredientsRes.json();
        // Handle both array and object response formats
        const ingredientsList = Array.isArray(data) ? data : (data.ingredients || []);
        const categoriesList = Array.isArray(data) 
          ? [...new Set(data.map((i: Ingredient) => i.category))]
          : (data.categories || []);
        
        // Map to expected interface (API uses name/nameKo, page expects englishName/koreanName)
        const mappedIngredients = ingredientsList.map((ing: any) => ({
          id: ing.id,
          category: ing.category || '',
          koreanName: ing.nameKo || ing.koreanName || '',
          englishName: ing.name || ing.englishName || '',
          quantity: ing.quantity || 0,
          unit: ing.baseUnit || ing.unit || 'g',
          yieldRate: ing.yieldRate || 100
        }));
        
        setIngredients(mappedIngredients);
        setCategories(categoriesList as string[]);
        
        // Create inventory data from ingredients
        const invData = mappedIngredients.map((ing: Ingredient) => ({
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
=======
      const res = await fetch('/api/inventory/groups');
      const data = await res.json();
      setGroups(data);
      if (data.length > 0) {
        setSelectedGroupId(data[0].id); // 기본적으로 첫 번째 그룹 선택
>>>>>>> 8bed49ac602314e85bc74842749bdb5a1fa01984
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPeriods = async (groupId: string) => {
    try {
      const res = await fetch(`/api/inventory/periods?groupId=${groupId}`);
      const data = await res.json();
      setPeriods(data);
    } catch (error) {
      console.error('Failed to fetch periods:', error);
    }
  };

  const handleCreateGroup = async () => {
    const name = prompt('Enter new group name (e.g., PURI Store):');
    if (!name) return;

    try {
      const res = await fetch('/api/inventory/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        fetchGroups(); // 목록 갱신
      }
    } catch (error) {
      alert('Failed to create group');
    }
  };

  const handleCreatePeriod = async () => {
    if (!selectedGroupId) return;

    // 간단한 날짜 입력 (추후 DatePicker로 개선 가능)
    const startDateStr = prompt('Start Date (YYYY-MM-DD):', format(new Date(), 'yyyy-MM-dd'));
    if (!startDateStr) return;
    
    const endDateStr = prompt('End Date (YYYY-MM-DD):', format(new Date(), 'yyyy-MM-dd'));
    if (!endDateStr) return;

    try {
      const res = await fetch('/api/inventory/periods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: selectedGroupId,
          startDate: startDateStr,
          endDate: endDateStr,
          notes: 'Created manually',
        }),
      });
      
      if (res.ok) {
        fetchPeriods(selectedGroupId); // 목록 갱신
      } else {
        alert('Failed to create period');
      }
    } catch (error) {
      console.error(error);
      alert('Error creating period');
    }
  };

  if (isLoading) return <div className="p-8">Loading inventory data...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
        <Button onClick={handleCreateGroup}>+ New Store Group</Button>
      </div>

      {/* 그룹 선택 탭 */}
      <div className="flex space-x-2 border-b border-gray-200 pb-2 overflow-x-auto">
        {groups.map((group) => (
          <button
            key={group.id}
            onClick={() => setSelectedGroupId(group.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
              selectedGroupId === group.id
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {group.name}
          </button>
        ))}
      </div>

      {/* 기간 목록 및 생성 버튼 */}
      {selectedGroupId ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-700">Inventory Periods</h2>
            <Button onClick={handleCreatePeriod} variant="outline">
              + Start New Period
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {periods.length === 0 ? (
              <div className="col-span-full text-center py-10 text-gray-500 bg-gray-50 rounded-lg">
                No inventory periods found. Start a new one!
              </div>
            ) : (
              periods.map((period) => (
                <Card 
                  key={period.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => router.push(`/dashboard/inventory/${period.id}`)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">
                        {format(new Date(period.startDate), 'MMM d')} - {format(new Date(period.endDate), 'MMM d, yyyy')}
                      </CardTitle>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        period.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {period.status}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500 mb-2">
                      {period._count.items} items tracked
                    </p>
                    {period.notes && (
                      <p className="text-sm text-gray-400 italic truncate">
                        {period.notes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500">
          Please create a store group to get started.
        </div>
      )}
    </div>
  );
}
