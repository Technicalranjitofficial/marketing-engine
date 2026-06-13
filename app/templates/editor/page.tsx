"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Sidebar, Header } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { 
  ArrowLeft, Save, Eye, Code, Type, Image, Square, 
  Minus, MoveVertical, Columns, MousePointer, Trash2,
  ChevronUp, ChevronDown, Palette, AlignLeft, AlignCenter, AlignRight,
  Link, Bold
} from "lucide-react";
import { toast } from "sonner";

// ============================================
// TYPES
// ============================================
type BlockType = "text" | "image" | "button" | "divider" | "spacer" | "columns" | "header";

interface BlockStyles {
  backgroundColor?: string;
  color?: string;
  fontSize?: string;
  fontWeight?: string;
  textAlign?: "left" | "center" | "right";
  padding?: string;
  borderRadius?: string;
  width?: string;
  height?: string;
}

interface Block {
  id: string;
  type: BlockType;
  content: string;
  styles: BlockStyles;
  // For button
  url?: string;
  // For image
  src?: string;
  alt?: string;
  // For columns
  columns?: Block[][];
}

// ============================================
// BLOCK DEFINITIONS
// ============================================
const BLOCK_TYPES: { type: BlockType; label: string; icon: React.ReactNode; defaultContent: string }[] = [
  { type: "header", label: "Header", icon: <Bold className="h-4 w-4" />, defaultContent: "Your Heading Here" },
  { type: "text", label: "Text", icon: <Type className="h-4 w-4" />, defaultContent: "Write your content here..." },
  { type: "image", label: "Image", icon: <Image className="h-4 w-4" />, defaultContent: "" },
  { type: "button", label: "Button", icon: <Square className="h-4 w-4" />, defaultContent: "Click Here" },
  { type: "divider", label: "Divider", icon: <Minus className="h-4 w-4" />, defaultContent: "" },
  { type: "spacer", label: "Spacer", icon: <MoveVertical className="h-4 w-4" />, defaultContent: "" },
];

const DEFAULT_STYLES: Record<BlockType, BlockStyles> = {
  header: { fontSize: "28px", fontWeight: "700", color: "#ffffff", textAlign: "center", padding: "16px" },
  text: { fontSize: "16px", color: "#d1d5db", textAlign: "left", padding: "12px 0" },
  image: { width: "100%", borderRadius: "8px" },
  button: { backgroundColor: "#06D6FF", color: "#080E1E", fontSize: "14px", fontWeight: "700", padding: "14px 32px", borderRadius: "8px", textAlign: "center" },
  divider: { backgroundColor: "#1e293b", height: "1px", padding: "16px 0" },
  spacer: { height: "32px" },
  columns: { padding: "0" },
};

// ============================================
// UTILITY
// ============================================
const genId = () => `block_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

// ============================================
// BLOCK RENDERER (Canvas)
// ============================================
function BlockRenderer({ 
  block, 
  isSelected, 
  onSelect, 
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: { 
  block: Block; 
  isSelected: boolean; 
  onSelect: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const baseStyle: React.CSSProperties = {
    position: "relative",
    cursor: "pointer",
    outline: isSelected ? "2px solid #06D6FF" : "2px solid transparent",
    outlineOffset: "2px",
    borderRadius: "4px",
  };

  const renderContent = () => {
    switch (block.type) {
      case "header":
        return (
          <h1 style={{
            fontSize: block.styles.fontSize,
            fontWeight: block.styles.fontWeight as React.CSSProperties["fontWeight"],
            color: block.styles.color,
            textAlign: block.styles.textAlign,
            padding: block.styles.padding,
            margin: 0,
          }}>
            {block.content || "Heading"}
          </h1>
        );

      case "text":
        return (
          <p style={{
            fontSize: block.styles.fontSize,
            color: block.styles.color,
            textAlign: block.styles.textAlign,
            padding: block.styles.padding,
            margin: 0,
            lineHeight: 1.6,
          }}>
            {block.content || "Text content"}
          </p>
        );

      case "image":
        return block.src ? (
          <img 
            src={block.src} 
            alt={block.alt || ""} 
            style={{
              width: block.styles.width,
              borderRadius: block.styles.borderRadius,
              display: "block",
            }}
          />
        ) : (
          <div style={{
            padding: "40px",
            background: "#1e293b",
            borderRadius: block.styles.borderRadius,
            textAlign: "center",
            color: "#64748b",
            fontSize: "14px",
          }}>
            <Image className="h-8 w-8 mx-auto mb-2 opacity-50" />
            Click to add image URL
          </div>
        );

      case "button":
        return (
          <div style={{ textAlign: block.styles.textAlign, padding: "8px 0" }}>
            <span style={{
              display: "inline-block",
              backgroundColor: block.styles.backgroundColor,
              color: block.styles.color,
              fontSize: block.styles.fontSize,
              fontWeight: block.styles.fontWeight as React.CSSProperties["fontWeight"],
              padding: block.styles.padding,
              borderRadius: block.styles.borderRadius,
              textDecoration: "none",
            }}>
              {block.content || "Button"}
            </span>
          </div>
        );

      case "divider":
        return (
          <div style={{ padding: block.styles.padding }}>
            <hr style={{
              border: "none",
              height: block.styles.height,
              backgroundColor: block.styles.backgroundColor,
              margin: 0,
            }} />
          </div>
        );

      case "spacer":
        return (
          <div style={{ 
            height: block.styles.height,
            background: isSelected ? "rgba(6, 214, 255, 0.05)" : "transparent",
            borderRadius: "4px",
          }} />
        );

      default:
        return null;
    }
  };

  return (
    <div style={baseStyle} onClick={onSelect}>
      {renderContent()}
      {isSelected && (
        <div style={{
          position: "absolute",
          top: "-32px",
          right: "0",
          display: "flex",
          gap: "4px",
          background: "#0f172a",
          padding: "4px",
          borderRadius: "6px",
          border: "1px solid #1e293b",
        }}>
          {!isFirst && (
            <button onClick={(e) => { e.stopPropagation(); onMoveUp(); }} style={{ padding: "4px", background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}>
              <ChevronUp className="h-4 w-4" />
            </button>
          )}
          {!isLast && (
            <button onClick={(e) => { e.stopPropagation(); onMoveDown(); }} style={{ padding: "4px", background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}>
              <ChevronDown className="h-4 w-4" />
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ padding: "4px", background: "transparent", border: "none", color: "#ef4444", cursor: "pointer" }}>
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================
// PROPERTIES PANEL
// ============================================
function PropertiesPanel({ 
  block, 
  onChange 
}: { 
  block: Block | null; 
  onChange: (updates: Partial<Block>) => void;
}) {
  if (!block) {
    return (
      <div style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>
        <MousePointer className="h-8 w-8 mx-auto mb-3 opacity-40" />
        <p style={{ fontSize: "14px" }}>Select a block to edit its properties</p>
      </div>
    );
  }

  const updateStyle = (key: keyof BlockStyles, value: string) => {
    onChange({ styles: { ...block.styles, [key]: value } });
  };

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {block.type} Properties
      </div>

      {/* Content */}
      {(block.type === "header" || block.type === "text" || block.type === "button") && (
        <div>
          <label style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Content</label>
          {block.type === "text" ? (
            <Textarea
              value={block.content}
              onChange={(e) => onChange({ content: e.target.value })}
              rows={4}
            />
          ) : (
            <Input
              value={block.content}
              onChange={(e) => onChange({ content: e.target.value })}
            />
          )}
        </div>
      )}

      {/* Image URL */}
      {block.type === "image" && (
        <>
          <div>
            <label style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Image URL</label>
            <Input
              value={block.src || ""}
              onChange={(e) => onChange({ src: e.target.value })}
              placeholder="https://example.com/image.png"
            />
          </div>
          <div>
            <label style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Alt Text</label>
            <Input
              value={block.alt || ""}
              onChange={(e) => onChange({ alt: e.target.value })}
              placeholder="Image description"
            />
          </div>
        </>
      )}

      {/* Button URL */}
      {block.type === "button" && (
        <div>
          <label style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "6px" }}>
            <Link className="h-3 w-3 inline mr-1" /> Button URL
          </label>
          <Input
            value={block.url || ""}
            onChange={(e) => onChange({ url: e.target.value })}
            placeholder="https://kiitconnect.com"
          />
        </div>
      )}

      {/* Text Align */}
      {(block.type === "header" || block.type === "text" || block.type === "button") && (
        <div>
          <label style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Alignment</label>
          <div style={{ display: "flex", gap: "4px" }}>
            {(["left", "center", "right"] as const).map((align) => (
              <button
                key={align}
                onClick={() => updateStyle("textAlign", align)}
                style={{
                  flex: 1,
                  padding: "8px",
                  background: block.styles.textAlign === align ? "#1e293b" : "transparent",
                  border: "1px solid #1e293b",
                  borderRadius: "6px",
                  color: block.styles.textAlign === align ? "#06D6FF" : "#64748b",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {align === "left" && <AlignLeft className="h-4 w-4" />}
                {align === "center" && <AlignCenter className="h-4 w-4" />}
                {align === "right" && <AlignRight className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Font Size */}
      {(block.type === "header" || block.type === "text" || block.type === "button") && (
        <div>
          <label style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Font Size</label>
          <Select
            value={block.styles.fontSize || "16px"}
            onChange={(e) => updateStyle("fontSize", e.target.value)}
          >
            <option value="12px">12px - Small</option>
            <option value="14px">14px - Body</option>
            <option value="16px">16px - Normal</option>
            <option value="18px">18px - Large</option>
            <option value="24px">24px - Heading</option>
            <option value="28px">28px - Title</option>
            <option value="36px">36px - Hero</option>
          </Select>
        </div>
      )}

      {/* Colors */}
      {(block.type === "header" || block.type === "text") && (
        <div>
          <label style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "6px" }}>
            <Palette className="h-3 w-3 inline mr-1" /> Text Color
          </label>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {["#ffffff", "#d1d5db", "#94a3b8", "#06D6FF", "#9333EA", "#22c55e", "#f59e0b", "#ef4444"].map((color) => (
              <button
                key={color}
                onClick={() => updateStyle("color", color)}
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "6px",
                  background: color,
                  border: block.styles.color === color ? "2px solid #06D6FF" : "2px solid #1e293b",
                  cursor: "pointer",
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Button Colors */}
      {block.type === "button" && (
        <>
          <div>
            <label style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Button Color</label>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {["#06D6FF", "#9333EA", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#ffffff", "#1e293b"].map((color) => (
                <button
                  key={color}
                  onClick={() => updateStyle("backgroundColor", color)}
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "6px",
                    background: color,
                    border: block.styles.backgroundColor === color ? "2px solid #06D6FF" : "2px solid #1e293b",
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Text Color</label>
            <div style={{ display: "flex", gap: "6px" }}>
              {["#080E1E", "#ffffff", "#1e293b"].map((color) => (
                <button
                  key={color}
                  onClick={() => updateStyle("color", color)}
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "6px",
                    background: color,
                    border: block.styles.color === color ? "2px solid #06D6FF" : "2px solid #1e293b",
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Spacer Height */}
      {block.type === "spacer" && (
        <div>
          <label style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Height</label>
          <Select
            value={block.styles.height || "32px"}
            onChange={(e) => updateStyle("height", e.target.value)}
          >
            <option value="16px">16px - Small</option>
            <option value="24px">24px - Medium</option>
            <option value="32px">32px - Normal</option>
            <option value="48px">48px - Large</option>
            <option value="64px">64px - Extra Large</option>
          </Select>
        </div>
      )}

      {/* Divider Color */}
      {block.type === "divider" && (
        <div>
          <label style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Divider Color</label>
          <div style={{ display: "flex", gap: "6px" }}>
            {["#1e293b", "#334155", "#06D6FF", "#9333EA"].map((color) => (
              <button
                key={color}
                onClick={() => updateStyle("backgroundColor", color)}
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "6px",
                  background: color,
                  border: block.styles.backgroundColor === color ? "2px solid #06D6FF" : "2px solid #1e293b",
                  cursor: "pointer",
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// HTML GENERATOR
// ============================================
function generateEmailHtml(blocks: Block[], templateName: string): string {
  const renderBlock = (block: Block): string => {
    switch (block.type) {
      case "header":
        return `<h1 style="font-size:${block.styles.fontSize};font-weight:${block.styles.fontWeight};color:${block.styles.color};text-align:${block.styles.textAlign};padding:${block.styles.padding};margin:0;">${block.content}</h1>`;

      case "text":
        return `<p style="font-size:${block.styles.fontSize};color:${block.styles.color};text-align:${block.styles.textAlign};padding:${block.styles.padding};margin:0;line-height:1.6;">${block.content}</p>`;

      case "image":
        return block.src 
          ? `<img src="${block.src}" alt="${block.alt || ""}" style="width:${block.styles.width};border-radius:${block.styles.borderRadius};display:block;" />`
          : "";

      case "button":
        return `<div style="text-align:${block.styles.textAlign};padding:8px 0;">
          <a href="${block.url || "#"}" style="display:inline-block;background:${block.styles.backgroundColor};color:${block.styles.color};font-size:${block.styles.fontSize};font-weight:${block.styles.fontWeight};padding:${block.styles.padding};border-radius:${block.styles.borderRadius};text-decoration:none;">${block.content}</a>
        </div>`;

      case "divider":
        return `<div style="padding:${block.styles.padding}"><hr style="border:none;height:${block.styles.height};background:${block.styles.backgroundColor};margin:0;" /></div>`;

      case "spacer":
        return `<div style="height:${block.styles.height};"></div>`;

      default:
        return "";
    }
  };

  const bodyContent = blocks.map(renderBlock).join("\n");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${templateName}</title>
  <style>
    body, .body { background-color: #080E1E !important; }
    u + .body .kc-cell { background-color: #080E1E !important; }
    @media (prefers-color-scheme: dark) {
      .kc-cell { background-color: #080E1E !important; }
    }
  </style>
</head>
<body class="body" style="margin:0;padding:0;background:#080E1E;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#080E1E;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td class="kc-cell" bgcolor="#080E1E" style="background:#080E1E;padding:32px;border-radius:16px;border:1px solid #1e293b;">
              ${bodyContent}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ============================================
// MAIN EDITOR PAGE
// ============================================
export default function TemplateEditorPage() {
  const router = useRouter();
  const [blocks, setBlocks] = useState<Block[]>([
    { id: genId(), type: "header", content: "Welcome to KIITConnect", styles: DEFAULT_STYLES.header },
    { id: genId(), type: "text", content: "We're excited to have you here. Check out what's new:", styles: DEFAULT_STYLES.text },
    { id: genId(), type: "button", content: "Get Started →", url: "https://kiitconnect.com", styles: DEFAULT_STYLES.button },
  ]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState("Untitled Template");
  const [showPreview, setShowPreview] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const selectedBlock = blocks.find((b) => b.id === selectedId) || null;

  const addBlock = (type: BlockType) => {
    const newBlock: Block = {
      id: genId(),
      type,
      content: BLOCK_TYPES.find((b) => b.type === type)?.defaultContent || "",
      styles: { ...DEFAULT_STYLES[type] },
    };
    setBlocks([...blocks, newBlock]);
    setSelectedId(newBlock.id);
  };

  const updateBlock = (id: string, updates: Partial<Block>) => {
    setBlocks(blocks.map((b) => 
      b.id === id ? { ...b, ...updates, styles: { ...b.styles, ...updates.styles } } : b
    ));
  };

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter((b) => b.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    const newBlocks = [...blocks];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
    setBlocks(newBlocks);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, type: BlockType) => {
    e.dataTransfer.setData("blockType", type);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("blockType") as BlockType;
    if (type) {
      const newBlock: Block = {
        id: genId(),
        type,
        content: BLOCK_TYPES.find((b) => b.type === type)?.defaultContent || "",
        styles: { ...DEFAULT_STYLES[type] },
      };
      const newBlocks = [...blocks];
      newBlocks.splice(index, 0, newBlock);
      setBlocks(newBlocks);
      setSelectedId(newBlock.id);
    }
    setDragOverIndex(null);
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }
    setSaving(true);
    try {
      const html = generateEmailHtml(blocks, templateName);
      const res = await fetch("/api/templates/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateName,
          html,
          blocks: JSON.stringify(blocks),
        }),
      });
      if (res.ok) {
        toast.success("Template saved!");
        router.push("/templates");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to save");
      }
    } catch {
      toast.error("Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  const generatedHtml = generateEmailHtml(blocks, templateName);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "hsl(var(--background))" }}>
      <Sidebar />
      
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top Bar */}
        <header style={{
          height: "56px",
          borderBottom: "1px solid hsl(var(--border))",
          background: "hsl(var(--card))",
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          gap: "16px",
          flexShrink: 0,
        }}>
          <Button variant="ghost" size="sm" onClick={() => router.push("/templates")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          
          <div style={{ width: "1px", height: "24px", background: "hsl(var(--border))" }} />
          
          <Input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            style={{ width: "240px", fontWeight: 600 }}
            placeholder="Template name..."
          />
          
          <div style={{ flex: 1 }} />
          
          <Button variant="outline" size="sm" onClick={() => setShowCode(true)}>
            <Code className="h-4 w-4 mr-1" /> View Code
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
            <Eye className="h-4 w-4 mr-1" /> Preview
          </Button>
          <Button size="sm" onClick={handleSave} isLoading={saving}>
            <Save className="h-4 w-4 mr-1" /> Save Template
          </Button>
        </header>

        {/* Editor Content */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Block Palette */}
          <aside style={{
            width: "200px",
            borderRight: "1px solid hsl(var(--border))",
            background: "hsl(var(--card))",
            padding: "16px",
            overflowY: "auto",
            flexShrink: 0,
          }}>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
              Blocks
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {BLOCK_TYPES.map((block) => (
                <div
                  key={block.type}
                  draggable
                  onDragStart={(e) => handleDragStart(e, block.type)}
                  onClick={() => addBlock(block.type)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 12px",
                    background: "hsl(var(--accent))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    cursor: "grab",
                    fontSize: "13px",
                    color: "hsl(var(--foreground))",
                  }}
                >
                  {block.icon}
                  <span>{block.label}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: "10px", color: "#64748b", marginTop: "16px", lineHeight: 1.5 }}>
              Drag blocks to canvas or click to add at bottom
            </div>
          </aside>

          {/* Canvas */}
          <div style={{
            flex: 1,
            background: "#0f172a",
            padding: "32px",
            overflowY: "auto",
          }}>
            <div style={{
              maxWidth: "600px",
              margin: "0 auto",
              background: "#080E1E",
              border: "1px solid #1e293b",
              borderRadius: "16px",
              padding: "32px",
              minHeight: "400px",
            }}>
              {blocks.length === 0 ? (
                <div
                  onDragOver={(e) => handleDragOver(e, 0)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, 0)}
                  style={{
                    padding: "48px",
                    textAlign: "center",
                    color: "#64748b",
                    border: dragOverIndex === 0 ? "2px dashed #06D6FF" : "2px dashed #1e293b",
                    borderRadius: "12px",
                  }}
                >
                  <Type className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p style={{ fontSize: "14px" }}>Drag blocks here or click a block to add</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {blocks.map((block, index) => (
                    <div key={block.id}>
                      {/* Drop zone before block */}
                      <div
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index)}
                        style={{
                          height: dragOverIndex === index ? "48px" : "8px",
                          background: dragOverIndex === index ? "rgba(6, 214, 255, 0.1)" : "transparent",
                          border: dragOverIndex === index ? "2px dashed #06D6FF" : "none",
                          borderRadius: "8px",
                          marginBottom: dragOverIndex === index ? "8px" : "0",
                        }}
                      />
                      <BlockRenderer
                        block={block}
                        isSelected={selectedId === block.id}
                        onSelect={() => setSelectedId(block.id)}
                        onDelete={() => deleteBlock(block.id)}
                        onMoveUp={() => moveBlock(index, "up")}
                        onMoveDown={() => moveBlock(index, "down")}
                        isFirst={index === 0}
                        isLast={index === blocks.length - 1}
                      />
                    </div>
                  ))}
                  {/* Drop zone at end */}
                  <div
                    onDragOver={(e) => handleDragOver(e, blocks.length)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, blocks.length)}
                    style={{
                      height: dragOverIndex === blocks.length ? "48px" : "24px",
                      background: dragOverIndex === blocks.length ? "rgba(6, 214, 255, 0.1)" : "transparent",
                      border: dragOverIndex === blocks.length ? "2px dashed #06D6FF" : "none",
                      borderRadius: "8px",
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Properties Panel */}
          <aside style={{
            width: "280px",
            borderLeft: "1px solid hsl(var(--border))",
            background: "hsl(var(--card))",
            overflowY: "auto",
            flexShrink: 0,
          }}>
            <div style={{
              padding: "12px 16px",
              borderBottom: "1px solid hsl(var(--border))",
              fontSize: "12px",
              fontWeight: "700",
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}>
              Properties
            </div>
            <PropertiesPanel
              block={selectedBlock}
              onChange={(updates) => selectedId && updateBlock(selectedId, updates)}
            />
          </aside>
        </div>
      </main>

      {/* Preview Modal */}
      {showPreview && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.9)" }}>
          <div style={{ width: "100%", maxWidth: "700px", height: "90vh", background: "hsl(var(--card))", borderRadius: "12px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid hsl(var(--border))", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 600 }}>Preview: {templateName}</span>
              <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>Close</Button>
            </div>
            <iframe
              srcDoc={generatedHtml}
              style={{ flex: 1, width: "100%", border: "none", background: "#080E1E" }}
              title="Email Preview"
            />
          </div>
        </div>
      )}

      {/* Code Modal */}
      {showCode && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.9)" }}>
          <div style={{ width: "100%", maxWidth: "800px", height: "90vh", background: "hsl(var(--card))", borderRadius: "12px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid hsl(var(--border))", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 600 }}>HTML Code</span>
              <div style={{ display: "flex", gap: "8px" }}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => { navigator.clipboard.writeText(generatedHtml); toast.success("Copied!"); }}
                >
                  Copy HTML
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowCode(false)}>Close</Button>
              </div>
            </div>
            <pre style={{ flex: 1, overflow: "auto", padding: "16px", margin: 0, fontSize: "12px", fontFamily: "monospace", color: "#94a3b8", background: "#0f172a" }}>
              {generatedHtml}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
