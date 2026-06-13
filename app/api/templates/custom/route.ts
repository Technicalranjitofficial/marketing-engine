import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/templates/custom - Save a custom template from editor
export async function POST(req: NextRequest) {
  try {
    const { name, html, blocks, description, category } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "Template name is required" }, { status: 400 });
    }
    if (!html?.trim() || html.trim().length < 20) {
      return NextResponse.json({ error: "Valid HTML content is required" }, { status: 400 });
    }

    // Create or update template
    const template = await prisma.emailTemplate.create({
      data: {
        name,
        description: description || `Custom template created with visual editor`,
        category: category || "Custom",
        htmlContent: html,
        mjmlContent: blocks, // Store blocks JSON in mjmlContent field
        isPublic: false,
        thumbnail: "🎨", // Default thumbnail for custom templates
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
    console.error("[API] Error saving custom template:", error);
    return NextResponse.json({ error: "Failed to save template" }, { status: 500 });
  }
}

// GET /api/templates/custom - List all custom templates
export async function GET() {
  try {
    const templates = await prisma.emailTemplate.findMany({
      where: {
        category: "Custom",
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        description: true,
        thumbnail: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("[API] Error fetching custom templates:", error);
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}
