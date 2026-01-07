import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get a single manual group with details
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
    const group = await prisma.manualGroup.findUnique({
      where: { id },
      include: {
        template: {
          include: {
            items: {
              include: { ingredient: true }
            }
          }
        },
        manuals: {
          include: {
            ingredients: {
              include: { ingredientMaster: true }
            },
            costVersions: {
              select: {
                id: true,
                manualId: true,
                templateId: true,
                description: true,
                totalCost: true,
                currency: true,
                costPerUnit: true,
                isActive: true,
                calculatedAt: true,
                createdAt: true,
                updatedAt: true,
                template: true,
                costLines: true
              }
            }
          },
          orderBy: { name: 'asc' }
        }
      }
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error('Error fetching manual group:', error);
    return NextResponse.json({ error: 'Failed to fetch group' }, { status: 500 });
  }
}

// PUT - Update a manual group (including apply template to all manuals)
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
    const { name, description, templateId, currency, applyTemplateToAll } = body;

    // Update group
    const group = await prisma.manualGroup.update({
      where: { id },
      data: {
        name,
        description,
        templateId,
        currency
      }
    });

    // If applyTemplateToAll is true, calculate costs for all manuals in this group
    if (applyTemplateToAll && templateId) {
      const manuals = await prisma.menuManual.findMany({
        where: { groupId: id },
        include: {
          ingredients: {
            include: { ingredientMaster: true }
          }
        }
      });

      const template = await prisma.ingredientTemplate.findUnique({
        where: { id: templateId },
        include: {
          items: {
            include: { ingredient: true }
          }
        }
      });

      if (template) {
        // Build price map
        const priceMap = new Map<string, { price: number; currency: string; yieldRate: number }>();
        for (const item of template.items) {
          priceMap.set(item.ingredientId, {
            price: item.price,
            currency: item.currency,
            yieldRate: item.yieldRate ?? item.ingredient.yieldRate
          });
        }

        // Calculate costs for each manual
        for (const manual of manuals) {
          // Delete existing cost version for this template
          await prisma.manualCostVersion.deleteMany({
            where: { manualId: manual.id, templateId }
          });

          // Calculate costs
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

          // Create new cost version
          await prisma.manualCostVersion.create({
            data: {
              manualId: manual.id,
              templateId,
              name: `${template.name} Cost`,
              totalCost,
              currency: currency || template.items[0]?.currency || 'CAD',
              costPerUnit: manual.yield ? totalCost / manual.yield : null,
              calculatedAt: new Date(),
              costLines: {
                create: costLines
              }
            }
          });
        }
      }
    }

    // Return updated group with details
    const updatedGroup = await prisma.manualGroup.findUnique({
      where: { id },
      include: {
        template: true,
        manuals: {
          include: {
            costVersions: {
              where: { isActive: true },
              select: {
                id: true,
                manualId: true,
                templateId: true,
                description: true,
                totalCost: true,
                currency: true,
                costPerUnit: true,
                isActive: true,
                calculatedAt: true,
                createdAt: true,
                updatedAt: true,
                template: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(updatedGroup);
  } catch (error) {
    console.error('Error updating manual group:', error);
    return NextResponse.json({ error: 'Failed to update group' }, { status: 500 });
  }
}

// DELETE - Delete a manual group
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
    // Unlink manuals from this group (don't delete them)
    await prisma.menuManual.updateMany({
      where: { groupId: id },
      data: { groupId: null }
    });

    await prisma.manualGroup.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting manual group:', error);
    return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 });
  }
}
