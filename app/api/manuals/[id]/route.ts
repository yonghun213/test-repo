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
        ingredients: {
          orderBy: [
            { section: 'asc' },
            { sortOrder: 'asc' }
          ],
          include: {
            ingredientMaster: true
          }
        },
        costVersions: {
          include: {
            template: true,
            costLines: {
              include: {
                ingredient: true
              }
            }
          }
        }
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
    const { name, koreanName, imageUrl, shelfLife, yield: yieldValue, yieldUnit, notes, isActive, ingredients, sellingPrice, cookingMethod } = body;

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
        cookingMethod: cookingMethod ? JSON.stringify(cookingMethod) : undefined
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
