import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/templates/custom/[id] - Get a single custom template
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const template = await prisma.emailTemplate.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        htmlContent: true,
        mjmlContent: true, // This contains the blocks JSON
        thumbnail: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("[API] Error fetching template:", error);
    return NextResponse.json({ error: "Failed to fetch template" }, { status: 500 });
  }
}

// PUT /api/templates/custom/[id] - Update a custom template
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name, html, blocks, description } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "Template name is required" }, { status: 400 });
    }
    if (!html?.trim() || html.trim().length < 20) {
      return NextResponse.json({ error: "Valid HTML content is required" }, { status: 400 });
    }

    const template = await prisma.emailTemplate.update({
      where: { id },
      data: {
        name,
        description: description || undefined,
        htmlContent: html,
        mjmlContent: blocks || undefined,
      },
    });

    return NextResponse.json({ 
      success: true, 
      template: {
        id: template.id,
        name: template.name,
      } 
    });
  } catch (error) {
    console.error("[API] Error updating template:", error);
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }
}

// DELETE /api/templates/custom/[id] - Delete a custom template
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.emailTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Error deleting template:", error);
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
  }
}
