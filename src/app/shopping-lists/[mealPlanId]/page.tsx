'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getShoppingList, updateShoppingList } from '@/lib/database';
import { createClient } from '@/lib/supabase/client';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Check, 
  Download, 
  Send,
  Trash2,
  Package,
  DollarSign,
  ArrowLeft
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, string> = {
  produce: '🥕',
  meat: '🥩',
  dairy: '🥛',
  pantry: '🏪',
  frozen: '❄️',
  other: '📦'
};

const CATEGORY_COLORS: Record<string, string> = {
  produce: 'bg-green-100 text-green-800',
  meat: 'bg-red-100 text-red-800',
  dairy: 'bg-blue-100 text-blue-800',
  pantry: 'bg-yellow-100 text-yellow-800',
  frozen: 'bg-cyan-100 text-cyan-800',
  other: 'bg-gray-100 text-gray-800'
};

export default function ShoppingListPage() {
  const params = useParams();
  const router = useRouter();
  const { userProfile } = useAuth();
  const [shoppingList, setShoppingList] = useState<any>(null);
  const [items, setItems] = useState([]);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  useEffect(() => {
    if (params.mealPlanId) {
      loadShoppingList();
    }
  }, [params.mealPlanId]);

  const loadShoppingList = async () => {
    try {
      const list = await getShoppingList(params.mealPlanId as string);
      if (list) {
        setShoppingList(list);
        setItems(list.items || []);
      }
    } catch (error: any) {
      console.error('Error loading shopping list:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateShoppingList = async () => {
    setGenerating(true);
    setError('');

    try {
      const { data, error } = await supabase.functions.invoke('generate-shopping-list', {
        body: {
          mealPlanId: params.mealPlanId,
          householdId: userProfile!.household_id
        }
      });

      if (error) throw error;

      await loadShoppingList(); // Refresh the list
    } catch (error: any) {
      setError(error.message || 'Failed to generate shopping list');
    } finally {
      setGenerating(false);
    }
  };

  const updateItemQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
      return;
    }

    const updatedItems = items.map((item: any) => 
      item.ingredient_id === itemId 
        ? { ...item, quantity: newQuantity }
        : item
    );

    setItems(updatedItems);
    await saveItems(updatedItems);
  };

  const removeItem = async (itemId: string) => {
    const updatedItems = items.filter((item: any) => item.ingredient_id !== itemId);
    setItems(updatedItems);
    await saveItems(updatedItems);
  };

  const toggleItemCheck = (itemId: string) => {
    const newCheckedItems = new Set(checkedItems);
    if (newCheckedItems.has(itemId)) {
      newCheckedItems.delete(itemId);
    } else {
      newCheckedItems.add(itemId);
    }
    setCheckedItems(newCheckedItems);
  };

  const saveItems = async (updatedItems: any[]) => {
    if (!shoppingList) return;

    try {
      await updateShoppingList(shoppingList.id, {
        items: updatedItems,
        total_estimated_cost: calculateTotalCost(updatedItems)
      });
    } catch (error) {
      console.error('Error saving items:', error);
    }
  };

  const calculateTotalCost = (items: any[]): number => {
    const categoryPrices: Record<string, number> = {
      produce: 2.50,
      meat: 8.00,
      dairy: 3.50,
      pantry: 2.00,
      frozen: 4.00,
      other: 3.00
    };

    return items.reduce((total, item) => {
      const basePrice = categoryPrices[item.category] || 3.00;
      return total + (basePrice * (item.quantity / 2));
    }, 0);
  };

  const exportToPrintable = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const categorizedItems = items.reduce((acc: any, item: any) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});

    const html = `
      <html>
        <head>
          <title>Shopping List</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
            h2 { color: #666; margin-top: 30px; }
            .item { margin: 5px 0; display: flex; align-items: center; }
            .checkbox { margin-right: 10px; }
            .quantity { font-weight: bold; margin-right: 10px; }
            .category { text-transform: capitalize; }
          </style>
        </head>
        <body>
          <h1>Shopping List</h1>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
          ${Object.entries(categorizedItems).map(([category, categoryItems]: [string, any]) => `
            <h2 class="category">${CATEGORY_ICONS[category] || '📦'} ${category}</h2>
            ${(categoryItems as any[]).map(item => `
              <div class="item">
                <input type="checkbox" class="checkbox">
                <span class="quantity">${item.quantity} ${item.unit}</span>
                <span>${item.name}</span>
              </div>
            `).join('')}
          `).join('')}
          <hr style="margin-top: 40px;">
          <p><strong>Total Items:</strong> ${items.length}</p>
          <p><strong>Estimated Cost:</strong> $${calculateTotalCost(items).toFixed(2)}</p>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  const exportToWalmartPlus = () => {
    // This would integrate with Walmart+ API in a real implementation
    alert('Walmart+ integration coming soon! For now, use the printable version.');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-lg">Loading shopping list...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!shoppingList) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="text-center py-12">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No shopping list yet</h3>
              <p className="text-muted-foreground mb-4">
                Generate a shopping list from your finalized meal plan
              </p>
              <Button onClick={generateShoppingList} disabled={generating}>
                {generating ? 'Generating...' : 'Generate Shopping List'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const categorizedItems = items.reduce((acc: any, item: any) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const checkedCount = checkedItems.size;
  const totalItems = items.length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => router.push(`/meal-plans/${params.mealPlanId}`)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Meal Plan
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Shopping List</h1>
              <p className="text-gray-600 mt-2">
                {totalItems} items • {checkedCount} checked • ${calculateTotalCost(items).toFixed(2)} estimated
              </p>
            </div>
            <div className="flex space-x-3">
              <Button onClick={exportToPrintable} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button onClick={exportToWalmartPlus}>
                <Send className="w-4 h-4 mr-2" />
                Export to Walmart+
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Package className="w-6 h-6 text-blue-500 mr-3" />
                <div>
                  <div className="text-xl font-bold">{totalItems}</div>
                  <div className="text-sm text-muted-foreground">Total Items</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Check className="w-6 h-6 text-green-500 mr-3" />
                <div>
                  <div className="text-xl font-bold">{checkedCount}</div>
                  <div className="text-sm text-muted-foreground">Checked Off</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <DollarSign className="w-6 h-6 text-green-500 mr-3" />
                <div>
                  <div className="text-xl font-bold">${calculateTotalCost(items).toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">Estimated Cost</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <ShoppingCart className="w-6 h-6 text-purple-500 mr-3" />
                <div>
                  <div className="text-xl font-bold">
                    {totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">Complete</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {Object.entries(categorizedItems).map(([category, categoryItems]: [string, any]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <span className="text-2xl mr-2">{CATEGORY_ICONS[category] || '📦'}</span>
                  <span className="capitalize">{category}</span>
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({(categoryItems as any[]).length} items)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(categoryItems as any[]).map((item: any) => (
                    <div 
                      key={item.ingredient_id} 
                      className={`flex items-center justify-between p-3 border rounded-lg ${
                        checkedItems.has(item.ingredient_id) ? 'bg-green-50 border-green-200' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => toggleItemCheck(item.ingredient_id)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            checkedItems.has(item.ingredient_id) 
                              ? 'bg-green-500 border-green-500 text-white' 
                              : 'border-gray-300'
                          }`}
                        >
                          {checkedItems.has(item.ingredient_id) && <Check className="w-3 h-3" />}
                        </button>
                        <div className={checkedItems.has(item.ingredient_id) ? 'line-through text-muted-foreground' : ''}>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.meal_sources.join(', ')}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateItemQuantity(item.ingredient_id, item.quantity - 0.5)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-16 text-center text-sm">
                            {item.quantity} {item.unit}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateItemQuantity(item.ingredient_id, item.quantity + 0.5)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.ingredient_id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}