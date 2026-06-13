import { NextRequest, NextResponse } from "next/server";
import { ALL_TEMPLATES } from "@/lib/templates";

// GET /api/templates - list all templates with metadata (no HTML)
export async function GET() {
  return NextResponse.json({
    templates: ALL_TEMPLATES.map(({ id, name, description, category, previewText, thumbnail }) => ({
      id, name, description, category, previewText, thumbnail,
    })),
  });
}

// POST /api/templates/preview - render template with vars and return HTML
export async function POST(request: NextRequest) {
  try {
    const { id, vars = {} } = await request.json();
    const template = ALL_TEMPLATES.find(t => t.id === id);
    if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });
    return NextResponse.json({ html: template.html(vars) });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to render template" }, { status: 500 });
  }
}
