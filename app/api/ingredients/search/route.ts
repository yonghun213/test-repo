import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Search ingredients by Korean or English name
// Optional: templateId parameter to include price from that template
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const limit = parseInt(searchParams.get('limit') || '10');
  const templateId = searchParams.get('templateId');

  if (!query || query.length < 1) {
    return NextResponse.json([]);
  }

  try {
    const ingredients = await prisma.ingredientMaster.findMany({
      where: {
        OR: [
          { nameKo: { contains: query } },
          { name: { contains: query } }
        ]
      },
      select: {
        id: true,
        name: true,
        nameKo: true,
        category: true,
        baseUnit: true,
        yieldRate: true,
        templateItems: templateId ? {
          where: { templateId },
          select: {
            price: true,
            currency: true
          }
        } : false
      },
      take: limit,
      orderBy: [
        { name: 'asc' }
      ]
    });

    // Add price info from template if available
    const result = ingredients.map((ing: any) => {
      const templateItem = templateId && ing.templateItems?.[0];
      return {
        id: ing.id,
        name: ing.name,
        nameKo: ing.nameKo,
        category: ing.category,
        baseUnit: ing.baseUnit,
        yieldRate: ing.yieldRate,
        price: templateItem ? templateItem.price : null,
        currency: templateItem ? templateItem.currency : null
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error searching ingredients:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
