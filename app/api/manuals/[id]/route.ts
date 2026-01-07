import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get a single manual with details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const manual = await prisma.menuManual.findUnique({
      where: { id },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            templateId: true
          }
        },
        ingredients: {
          orderBy: [
            { section: 'asc' },
            { sortOrder: 'asc' }
          ],
          include: {
            ingredientMaster: true
          }
        }
        // costVersions temporarily disabled - table schema needs to be fixed in Turso
      }
    });

    if (!manual) {
      return NextResponse.json({ error: 'Manual not found' }, { status: 404 });
    }

    return NextResponse.json(manual);
  } catch (error) {
    console.error('Error fetching manual:', error);
    return NextResponse.json({ error: 'Failed to fetch manual' }, { status: 500 });
  }
}

// PUT - Update a manual
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { name, koreanName, imageUrl, shelfLife, yield: yieldValue, yieldUnit, notes, isActive, ingredients, sellingPrice, cookingMethod, templateId } = body;

    // If templateId is provided, find or create the corresponding group
    let groupId = undefined;
    if (templateId) {
      // Find group with this templateId
      const group = await prisma.manualGroup.findFirst({
        where: { templateId }
      });
      
      if (group) {
        groupId = group.id;
      } else {
        // Create a new group for this template
        const template = await prisma.ingredientTemplate.findUnique({
          where: { id: templateId }
        });
        
        if (template) {
          const newGroup = await prisma.manualGroup.create({
            data: {
              name: `${template.name} Manuals`,
              templateId: template.id,
              currency: template.country === 'CA' ? 'CAD' : 'USD'
            }
          });
          groupId = newGroup.id;
        }
      }
    }

    // Update manual and optionally replace ingredients
    const manual = await prisma.menuManual.update({
      where: { id },
      data: {
        name,
        koreanName,
        imageUrl: imageUrl !== undefined ? imageUrl : undefined,
        shelfLife,
        yield: yieldValue,
        yieldUnit,
        notes,
        isActive,
        sellingPrice: sellingPrice !== undefined ? sellingPrice : undefined,
        cookingMethod: cookingMethod ? JSON.stringify(cookingMethod) : undefined,
        groupId: groupId !== undefined ? groupId : undefined
      }
    });

    // If ingredients are provided, replace them
    if (ingredients) {
      // Delete existing ingredients
      await prisma.manualIngredient.deleteMany({
        where: { manualId: id }
      });

      // Create new ingredients
      await prisma.manualIngredient.createMany({
        data: ingredients.map((ing: any, index: number) => ({
          manualId: id,
          ingredientId: ing.ingredientId || null,
          name: ing.name,
          koreanName: ing.koreanName,
          quantity: ing.quantity,
          unit: ing.unit,
          section: ing.section || 'MAIN',
          sortOrder: index,
          notes: ing.notes
        }))
      });
    }

    // Fetch updated manual
    const updatedManual = await prisma.menuManual.findUnique({
      where: { id },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            templateId: true
          }
        },
        ingredients: {
          orderBy: { sortOrder: 'asc' },
          include: {
            ingredientMaster: true
          }
        }
      }
    });

    return NextResponse.json(updatedManual);
  } catch (error) {
    console.error('Error updating manual:', error);
    return NextResponse.json({ error: 'Failed to update manual' }, { status: 500 });
  }
}

// DELETE - Delete a manual
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.menuManual.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting manual:', error);
    return NextResponse.json({ error: 'Failed to delete manual' }, { status: 500 });
  }
}
