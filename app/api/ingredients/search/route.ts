import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Search ingredients by Korean or English name
// Optional: templateId parameter to include price from that template
// When templateId is provided, only returns ingredients that exist in that template (with prices)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const limit = parseInt(searchParams.get('limit') || '10');
  const templateId = searchParams.get('templateId');

  if (!query || query.length < 1) {
    return NextResponse.json([]);
  }

  try {
    // If templateId is provided, search within template items only
    if (templateId) {
      const templateItems = await prisma.ingredientTemplateItem.findMany({
        where: {
          templateId,
          ingredient: {
            OR: [
              { nameKo: { contains: query } },
              { name: { contains: query } }
            ]
          }
        },
        include: {
          ingredient: {
            select: {
              id: true,
              name: true,
              nameKo: true,
              category: true,
              baseUnit: true,
              yieldRate: true
            }
          }
        },
        take: limit,
        orderBy: {
          ingredient: { name: 'asc' }
        }
      });

      // Format result with prices from template
      const result = templateItems.map((item: any) => ({
        id: item.ingredient.id,
        name: item.ingredient.name,
        nameKo: item.ingredient.nameKo,
        category: item.ingredient.category,
        baseUnit: item.ingredient.baseUnit,
        yieldRate: item.ingredient.yieldRate,
        price: item.price,
        currency: item.currency
      }));

      return NextResponse.json(result);
    }

    // No templateId - search all ingredients
    const ingredients = await prisma.ingredientMaster.findMany({
      where: {
        OR: [
          { koreanName: { contains: query } },
          { englishName: { contains: query } }
        ]
      },
      select: {
        id: true,
        koreanName: true,
        englishName: true,
        category: true,
<<<<<<< HEAD
        baseUnit: true,
        yieldRate: true
=======
        unit: true,
        yieldRate: true,
        templateItems: templateId ? {
          where: { templateId },
          select: {
            price: true,
            currency: true
          }
        } : false
>>>>>>> 8bed49ac602314e85bc74842749bdb5a1fa01984
      },
      take: limit,
      orderBy: [
        { englishName: 'asc' }
      ]
    });

<<<<<<< HEAD
    const result = ingredients.map((ing: any) => ({
      id: ing.id,
      name: ing.name,
      nameKo: ing.nameKo,
      category: ing.category,
      baseUnit: ing.baseUnit,
      yieldRate: ing.yieldRate,
      price: null,
      currency: null
    }));
=======
    // Add price info from template if available
    const result = ingredients.map(ing => {
      const templateItem = templateId && ing.templateItems?.[0];
      return {
        id: ing.id,
        koreanName: ing.koreanName,
        englishName: ing.englishName,
        category: ing.category,
        unit: ing.unit,
        yieldRate: ing.yieldRate,
        price: templateItem ? templateItem.price : null,
        currency: templateItem ? templateItem.currency : null
      };
    });
>>>>>>> 8bed49ac602314e85bc74842749bdb5a1fa01984

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error searching ingredients:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
