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
            { sortOrder: 'asc' }
          ],
          include: {
            ingredientMaster: true
          }
        },
        costVersions: {
          include: {
            template: true,
            costLines: true
          },
          orderBy: { createdAt: 'desc' }
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
    const { name, koreanName, yield: yieldValue, yieldUnit, isActive, isDeleted, ingredients, templateId } = body;

    // Build update data - only include defined fields (Turso schema)
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (koreanName !== undefined) updateData.nameKo = koreanName;
    if (yieldValue !== undefined) updateData.yield = yieldValue;
    if (yieldUnit !== undefined) updateData.yieldUnit = yieldUnit;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isDeleted !== undefined) updateData.isDeleted = isDeleted;

    // Update manual with Turso schema fields
    if (Object.keys(updateData).length > 0) {
      await prisma.menuManual.update({
        where: { id },
        data: updateData
      });
    }

    // If ingredients are provided, replace them
    if (ingredients) {
      // Delete existing ingredients
      await prisma.manualIngredient.deleteMany({
        where: { manualId: id }
      });

      // Create new ingredients (Turso schema)
      await prisma.manualIngredient.createMany({
        data: ingredients.map((ing: any, index: number) => ({
          manualId: id,
          ingredientId: ing.ingredientId || null,
          name: ing.name || ing.koreanName || 'Unknown',
          quantity: ing.quantity,
          unit: ing.unit,
          sortOrder: index,
          notes: ing.notes || null
        }))
      });
    }

    // Recalculate cost if templateId or ingredients changed
    if (templateId || ingredients) {
      const currentManual = await prisma.menuManual.findUnique({
        where: { id },
        include: { ingredients: true }
      });

      let targetTemplateId = templateId;
      if (!targetTemplateId) {
        // Turso schema doesn't have isActive in ManualCostVersion
        const costVersion = await prisma.manualCostVersion.findFirst({
          where: { manualId: id }
        });
        if (costVersion) targetTemplateId = costVersion.templateId;
      }

      if (targetTemplateId && currentManual) {
        const template = await prisma.ingredientTemplate.findUnique({
          where: { id: targetTemplateId },
          include: { items: true }
        });

        if (template) {
          const priceMap = new Map();
          for (const item of template.items) {
            priceMap.set(item.ingredientId, {
              price: item.price,
              currency: item.currency,
              yieldRate: item.yieldRate ?? 100
            });
          }

          let totalCost = 0;
          const costLines: any[] = [];

          for (const ing of currentManual.ingredients) {
            let unitPrice = 0;
            let yieldRate = 100;
            if (ing.ingredientId && priceMap.has(ing.ingredientId)) {
              const priceInfo = priceMap.get(ing.ingredientId);
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

          const existingVersion = await prisma.manualCostVersion.findUnique({
            where: { manualId_templateId: { manualId: id, templateId: targetTemplateId } }
          });

          // Map costLines with proper Prisma relation connect syntax
          const mappedCostLines = costLines.map(cl => ({
            ingredient: { connect: { id: cl.ingredientId } },
            unitPrice: cl.unitPrice,
            quantity: cl.quantity,
            unit: cl.unit,
            yieldRate: cl.yieldRate,
            lineCost: cl.lineCost
          }));

          if (existingVersion) {
            await prisma.manualCostLine.deleteMany({ where: { costVersionId: existingVersion.id } });
            await prisma.manualCostVersion.update({
              where: { id: existingVersion.id },
              data: {
                totalCost,
                costPerUnit: currentManual.yield ? totalCost / currentManual.yield : null,
                calculatedAt: new Date(),
                costLines: { create: mappedCostLines }
              }
            });
          } else {
            await prisma.manualCostVersion.create({
              data: {
                manualId: id,
                templateId: targetTemplateId,
                name: `${template.name} Cost`,
                totalCost,
                costPerUnit: currentManual.yield ? totalCost / currentManual.yield : null,
                calculatedAt: new Date(),
                costLines: { create: mappedCostLines }
              }
            });
          }
        }
      }
    }

    // Fetch updated manual
    const updatedManual = await prisma.menuManual.findUnique({
      where: { id },
      include: {
        ingredients: {
          orderBy: { sortOrder: 'asc' },
          include: { ingredientMaster: true }
        },
        costVersions: {
          include: { template: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return NextResponse.json(updatedManual);
  } catch (error) {
    console.error('Error updating manual:', error);
    return NextResponse.json({ error: 'Failed to update manual' }, { status: 500 });
  }
}

// DELETE - Delete a manual (Soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const user = session.user as { id: string; email: string };

  try {
    // Soft delete: set isDeleted to true (Turso schema)
    await prisma.menuManual.update({
      where: { id },
      data: { 
        isActive: false,
        isDeleted: true
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting manual:', error);
    return NextResponse.json({ error: 'Failed to delete manual' }, { status: 500 });
  }
}
