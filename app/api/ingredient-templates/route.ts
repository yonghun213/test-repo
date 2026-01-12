import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - List all ingredient templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeItems = searchParams.get('includeItems') === 'true';

    const templates = await prisma.ingredientTemplate.findMany({
      orderBy: { createdAt: 'desc' },
      include: includeItems ? {
        items: {
          include: {
            ingredient: true
          },
          orderBy: [
            { ingredient: { category: 'asc' } },
            { ingredient: { name: 'asc' } }
          ]
        }
      } : undefined
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Failed to fetch ingredient templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

// POST - Create new ingredient template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, countryId, description, currency } = body;

    if (!name) {
      return NextResponse.json({ error: 'Template name is required' }, { status: 400 });
    }

    // Get or create a default country if not provided
    let targetCountryId = countryId;
    if (!targetCountryId) {
      // Try to find existing Canada country
      const defaultCountry = await prisma.country.findFirst({ where: { code: 'CA' } });
      if (defaultCountry) {
        targetCountryId = defaultCountry.id;
      } else {
        return NextResponse.json({ error: 'Country ID is required' }, { status: 400 });
      }
    }

    // Create the template
    const template = await prisma.ingredientTemplate.create({
      data: {
        name,
        countryId: targetCountryId,
        description: description || null,
        isActive: true
      }
    });

    // Get all master ingredients and create template items
    const ingredients = await prisma.ingredientMaster.findMany();
    
    const defaultCurrency = currency || 'CAD';

    for (const ing of ingredients) {
      await prisma.ingredientTemplateItem.create({
        data: {
          templateId: template.id,
          ingredientId: ing.id,
          price: 0,
          currency: defaultCurrency
        }
      });
    }

    // Return template with items
    const fullTemplate = await prisma.ingredientTemplate.findUnique({
      where: { id: template.id },
      include: {
        items: {
          include: {
            ingredient: true
          }
        }
      }
    });

    return NextResponse.json(fullTemplate, { status: 201 });
  } catch (error) {
    console.error('Failed to create ingredient template:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}
