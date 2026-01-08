import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET - List all menu manuals (Force redeploy)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const includeIngredients = searchParams.get('includeIngredients') === 'true';
  const includeCostVersions = searchParams.get('includeCostVersions') === 'true';
  const groupId = searchParams.get('groupId');

  try {
    console.log('🔍 Fetching manuals...');
    console.log('Query params:', { groupId, includeIngredients, includeCostVersions });
    
    const manuals = await prisma.menuManual.findMany({
      where: groupId ? { groupId } : undefined,
      include: {
        group: true,
        ingredients: includeIngredients ? {
          orderBy: [
            { section: 'asc' },
            { sortOrder: 'asc' }
          ],
          include: {
            ingredientMaster: true
          }
        } : false,
        costVersions: includeCostVersions ? {
          include: {
            template: true
          },
          orderBy: { createdAt: 'desc' }
        } : false
      },
      orderBy: { name: 'asc' }
    });

    console.log(`✅ Found ${manuals.length} manuals`);
    if (manuals.length > 0) {
      console.log('First manual:', JSON.stringify(manuals[0], null, 2));
    }

    return NextResponse.json(manuals);
  } catch (error: any) {
    console.error('❌ Error fetching manuals:', error);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    return NextResponse.json({ 
      error: 'Failed to fetch manuals',
      details: error?.message,
      stack: error?.stack?.split('\n').slice(0, 5).join('\n')
    }, { status: 500 });
  }
}

// POST - Create a new menu manual (and add to all groups)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, koreanName, imageUrl, shelfLife, yield: yieldValue, yieldUnit, sellingPrice, notes, cookingMethod, ingredients, addToAllGroups } = body;

    // Get all active groups
    const groups = addToAllGroups ? await prisma.manualGroup.findMany({
      where: { isActive: true },
      include: { template: { include: { items: { include: { ingredient: true } } } } }
    }) : [];

    // If no groups exist, create a default one
    if (addToAllGroups && groups.length === 0) {
      const defaultGroup = await prisma.manualGroup.create({
        data: {
          name: 'Default',
          description: 'Default manual group'
        }
      });
      groups.push({ ...defaultGroup, template: null });
    }

    const createdManuals = [];

    // Create manual for each group (or just one if not adding to all groups)
    const groupsToCreate = addToAllGroups ? groups : [null];

    for (const group of groupsToCreate) {
      const manual = await prisma.menuManual.create({
        data: {
          name,
          koreanName,
          imageUrl: imageUrl || null,
          shelfLife,
          yield: yieldValue,
          yieldUnit,
          sellingPrice: sellingPrice || null,
          notes,
          cookingMethod: cookingMethod ? JSON.stringify(cookingMethod) : null,
          groupId: group?.id || null,
          ingredients: ingredients ? {
            create: ingredients.map((ing: any, index: number) => ({
              ingredientId: ing.ingredientId || null,
              name: ing.name,
              koreanName: ing.koreanName,
              quantity: ing.quantity || 0,
              unit: ing.unit || 'g',
              section: ing.section || 'MAIN',
              sortOrder: index,
              notes: ing.notes
            }))
          } : undefined
        },
        include: {
          group: true,
          ingredients: {
            orderBy: { sortOrder: 'asc' },
            include: {
              ingredientMaster: true
            }
          }
        }
      });

      createdManuals.push(manual);

      // If group has a template, calculate cost version
      if (group?.template) {
        const priceMap = new Map<string, { price: number; currency: string; yieldRate: number }>();
        for (const item of group.template.items) {
          priceMap.set(item.ingredientId, {
            price: item.price,
            currency: item.currency,
            yieldRate: item.yieldRate ?? item.ingredient.yieldRate
          });
        }

        let totalCost = 0;
        const costLines: Array<{
          ingredientId: string;
          unitPrice: number;
          quantity: number;
          unit: string;
          yieldRate: number;
          lineCost: number;
        }> = [];

        for (const ing of manual.ingredients) {
          let unitPrice = 0;
          let yieldRate = 100;

          if (ing.ingredientId && priceMap.has(ing.ingredientId)) {
            const priceInfo = priceMap.get(ing.ingredientId)!;
            unitPrice = priceInfo.price;
            yieldRate = priceInfo.yieldRate;
          }

          const lineCost = unitPrice * ing.quantity * (100 / yieldRate);
          totalCost += lineCost;

          costLines.push({
            ingredientId: ing.id,
            unitPrice,
            quantity: ing.quantity,
            unit: ing.unit,
            yieldRate,
            lineCost
          });
        }

        await prisma.manualCostVersion.create({
          data: {
            manualId: manual.id,
            templateId: group.template.id,
            name: `${group.template.name} Cost`,
            totalCost,
            currency: group.currency || 'CAD',
            costPerUnit: yieldValue ? totalCost / yieldValue : null,
            calculatedAt: new Date(),
            costLines: {
              create: costLines
            }
          }
        });
      }
    }

    return NextResponse.json(createdManuals, { status: 201 });
  } catch (error: any) {
    console.error('=== Error creating manual ===');
    console.error('Error object:', error);
    console.error('Error message:', error?.message);
    console.error('Error code:', error?.code);
    console.error('Error stack:', error?.stack);
    console.error('Error name:', error?.name);
    
    const errorMessage = error?.message || 'Unknown error';
    const errorCode = error?.code || error?.name || 'UNKNOWN';
    const errorStack = error?.stack?.split('\n').slice(0, 3).join('\n') || '';
    
    return NextResponse.json({ 
      error: 'Failed to create manual', 
      details: errorMessage,
      code: errorCode,
      stack: errorStack,
      hint: `${errorCode}: ${errorMessage}`,
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
    }, { status: 500 });
  }
}
