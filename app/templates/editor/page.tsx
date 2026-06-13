"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { 
  ArrowLeft, Save, Eye, Code, Type, Image, Square, 
  Minus, MoveVertical, MousePointer, Trash2, Copy,
  ChevronUp, ChevronDown, Palette, AlignLeft, AlignCenter, AlignRight,
  Link, Bold, Layers, Settings, Undo2, Redo2, Smartphone, Monitor,
  Facebook, Twitter, Linkedin, Instagram, Mail, Globe,
  Sparkles, FileCode, Upload, Info, X
} from "lucide-react";
import { toast } from "sonner";

// ============================================
// TYPES
// ============================================
type BlockType = "text" | "image" | "button" | "divider" | "spacer" | "header" | "social" | "footer" | "logo" | "twoColumn";

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
  url?: string;
  src?: string;
  alt?: string;
  socialLinks?: { platform: string; url: string }[];
  leftContent?: string;
  rightContent?: string;
}

// ============================================
// BLOCK DEFINITIONS
// ============================================
const BLOCK_TYPES: { type: BlockType; label: string; icon: React.ReactNode; defaultContent: string; category: string }[] = [
  { type: "header", label: "Heading", icon: <Bold className="h-4 w-4" />, defaultContent: "Your Heading Here", category: "Content" },
  { type: "text", label: "Text Block", icon: <Type className="h-4 w-4" />, defaultContent: "Write your content here...", category: "Content" },
  { type: "image", label: "Image", icon: <Image className="h-4 w-4" />, defaultContent: "", category: "Media" },
  { type: "logo", label: "Logo", icon: <Sparkles className="h-4 w-4" />, defaultContent: "", category: "Media" },
  { type: "button", label: "Button", icon: <Square className="h-4 w-4" />, defaultContent: "Click Here", category: "Actions" },
  { type: "social", label: "Social Icons", icon: <Globe className="h-4 w-4" />, defaultContent: "", category: "Actions" },
  { type: "divider", label: "Divider", icon: <Minus className="h-4 w-4" />, defaultContent: "", category: "Layout" },
  { type: "spacer", label: "Spacer", icon: <MoveVertical className="h-4 w-4" />, defaultContent: "", category: "Layout" },
  { type: "twoColumn", label: "Two Columns", icon: <Layers className="h-4 w-4" />, defaultContent: "", category: "Layout" },
  { type: "footer", label: "Footer", icon: <Mail className="h-4 w-4" />, defaultContent: "© 2024 KIITConnect. All rights reserved.", category: "Layout" },
];

const DEFAULT_STYLES: Record<BlockType, BlockStyles> = {
  header: { fontSize: "28px", fontWeight: "700", color: "#ffffff", textAlign: "center", padding: "16px 0" },
  text: { fontSize: "16px", color: "#d1d5db", textAlign: "left", padding: "12px 0" },
  image: { width: "100%", borderRadius: "8px" },
  logo: { width: "120px", borderRadius: "0" },
  button: { backgroundColor: "#06D6FF", color: "#080E1E", fontSize: "14px", fontWeight: "700", padding: "14px 32px", borderRadius: "8px", textAlign: "center" },
  social: { textAlign: "center", padding: "16px 0" },
  divider: { backgroundColor: "#1e293b", height: "1px", padding: "16px 0" },
  spacer: { height: "32px" },
  twoColumn: { padding: "16px 0" },
  footer: { fontSize: "12px", color: "#64748b", textAlign: "center", padding: "24px 0" },
};

const DEFAULT_SOCIAL_LINKS = [
  { platform: "twitter", url: "https://twitter.com/kiitconnect" },
  { platform: "linkedin", url: "https://linkedin.com/company/kiitconnect" },
  { platform: "instagram", url: "https://instagram.com/kiitconnect" },
];

// ============================================
// UTILITY
// ============================================
const genId = () => `block_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  twitter: <Twitter className="h-5 w-5" />,
  facebook: <Facebook className="h-5 w-5" />,
  linkedin: <Linkedin className="h-5 w-5" />,
  instagram: <Instagram className="h-5 w-5" />,
};

// ============================================
// BLOCK RENDERER (Canvas)
// ============================================
function BlockRenderer({ 
  block, 
  isSelected, 
  onSelect, 
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: { 
  block: Block; 
  isSelected: boolean; 
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
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
            whiteSpace: "pre-wrap",
          }}>
            {block.content || "Text content"}
          </p>
        );

      case "image":
      case "logo":
        return block.src ? (
          <div style={{ textAlign: block.styles.textAlign || "center" }}>
            <img 
              src={block.src} 
              alt={block.alt || ""} 
              style={{
                width: block.type === "logo" ? block.styles.width : "100%",
                maxWidth: "100%",
                borderRadius: block.styles.borderRadius,
                display: "inline-block",
              }}
            />
          </div>
        ) : (
          <div className="p-8 md:p-10 bg-slate-800/50 rounded-lg text-center text-slate-500 text-sm">
            <Image className="h-8 w-8 mx-auto mb-2 opacity-50" />
            {block.type === "logo" ? "Add logo URL" : "Add image URL"}
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

      case "social":
        return (
          <div style={{ textAlign: block.styles.textAlign, padding: block.styles.padding }}>
            <div className="flex items-center justify-center gap-4">
              {(block.socialLinks || DEFAULT_SOCIAL_LINKS).map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 hover:bg-cyan-500 hover:text-slate-900 transition-colors"
                >
                  {SOCIAL_ICONS[link.platform] || <Globe className="h-5 w-5" />}
                </a>
              ))}
            </div>
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

      case "twoColumn":
        return (
          <div className="grid grid-cols-2 gap-4" style={{ padding: block.styles.padding }}>
            <div className="p-4 bg-slate-800/30 rounded-lg text-sm text-slate-400">
              {block.leftContent || "Left column content"}
            </div>
            <div className="p-4 bg-slate-800/30 rounded-lg text-sm text-slate-400">
              {block.rightContent || "Right column content"}
            </div>
          </div>
        );

      case "footer":
        return (
          <div style={{
            fontSize: block.styles.fontSize,
            color: block.styles.color,
            textAlign: block.styles.textAlign,
            padding: block.styles.padding,
            borderTop: "1px solid #1e293b",
          }}>
            <p style={{ margin: 0 }}>{block.content}</p>
            <p style={{ margin: "8px 0 0", fontSize: "11px" }}>
              <a href="{{unsubscribeUrl}}" style={{ color: "#64748b" }}>Unsubscribe</a>
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div 
      onClick={onSelect}
      className={`relative cursor-pointer rounded transition-all ${
        isSelected ? "ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900" : "ring-2 ring-transparent"
      }`}
    >
      {renderContent()}
      {isSelected && (
        <div className="absolute -top-10 right-0 flex gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700 shadow-lg z-10">
          {!isFirst && (
            <button onClick={(e) => { e.stopPropagation(); onMoveUp(); }} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors">
              <ChevronUp className="h-4 w-4" />
            </button>
          )}
          {!isLast && (
            <button onClick={(e) => { e.stopPropagation(); onMoveDown(); }} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors">
              <ChevronDown className="h-4 w-4" />
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); onDuplicate(); }} className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors">
            <Copy className="h-4 w-4" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300 transition-colors">
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
      <div className="p-6 text-center text-slate-500">
        <MousePointer className="h-8 w-8 mx-auto mb-3 opacity-40" />
        <p className="text-sm">Select a block to edit</p>
      </div>
    );
  }

  const updateStyle = (key: keyof BlockStyles, value: string) => {
    onChange({ styles: { ...block.styles, [key]: value } });
  };

  return (
    <div className="p-4 space-y-5">
      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
        {block.type} Properties
      </div>

      {/* Content */}
      {(block.type === "header" || block.type === "text" || block.type === "button" || block.type === "footer") && (
        <div>
          <label className="text-xs text-slate-400 block mb-1.5">Content</label>
          {block.type === "text" || block.type === "footer" ? (
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

      {/* Two Column Content */}
      {block.type === "twoColumn" && (
        <>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Left Column</label>
            <Textarea
              value={block.leftContent || ""}
              onChange={(e) => onChange({ leftContent: e.target.value })}
              rows={3}
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Right Column</label>
            <Textarea
              value={block.rightContent || ""}
              onChange={(e) => onChange({ rightContent: e.target.value })}
              rows={3}
            />
          </div>
        </>
      )}

      {/* Image URL */}
      {(block.type === "image" || block.type === "logo") && (
        <>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Image URL</label>
            <Input
              value={block.src || ""}
              onChange={(e) => onChange({ src: e.target.value })}
              placeholder="https://example.com/image.png"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Alt Text</label>
            <Input
              value={block.alt || ""}
              onChange={(e) => onChange({ alt: e.target.value })}
              placeholder="Image description"
            />
          </div>
          {block.type === "logo" && (
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Width</label>
              <Select
                value={block.styles.width || "120px"}
                onChange={(e) => updateStyle("width", e.target.value)}
                options={[
                  { value: "80px", label: "80px - Small" },
                  { value: "120px", label: "120px - Medium" },
                  { value: "160px", label: "160px - Large" },
                  { value: "200px", label: "200px - XL" },
                ]}
              />
            </div>
          )}
        </>
      )}

      {/* Button URL */}
      {block.type === "button" && (
        <div>
          <label className="text-xs text-slate-400 flex items-center gap-1 mb-1.5">
            <Link className="h-3 w-3" /> Button URL
          </label>
          <Input
            value={block.url || ""}
            onChange={(e) => onChange({ url: e.target.value })}
            placeholder="https://kiitconnect.com"
          />
        </div>
      )}

      {/* Text Align */}
      {(block.type === "header" || block.type === "text" || block.type === "button" || block.type === "footer" || block.type === "logo" || block.type === "image") && (
        <div>
          <label className="text-xs text-slate-400 block mb-1.5">Alignment</label>
          <div className="flex gap-1">
            {(["left", "center", "right"] as const).map((align) => (
              <button
                key={align}
                onClick={() => updateStyle("textAlign", align)}
                className={`flex-1 p-2 rounded-lg border transition-colors flex items-center justify-center ${
                  block.styles.textAlign === align 
                    ? "bg-slate-700 border-cyan-500 text-cyan-400" 
                    : "border-slate-700 text-slate-500 hover:border-slate-600"
                }`}
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
          <label className="text-xs text-slate-400 block mb-1.5">Font Size</label>
          <Select
            value={block.styles.fontSize || "16px"}
            onChange={(e) => updateStyle("fontSize", e.target.value)}
            options={[
              { value: "12px", label: "12px - Small" },
              { value: "14px", label: "14px - Body" },
              { value: "16px", label: "16px - Normal" },
              { value: "18px", label: "18px - Large" },
              { value: "24px", label: "24px - Heading" },
              { value: "28px", label: "28px - Title" },
              { value: "36px", label: "36px - Hero" },
              { value: "48px", label: "48px - Display" },
            ]}
          />
        </div>
      )}

      {/* Colors */}
      {(block.type === "header" || block.type === "text" || block.type === "footer") && (
        <div>
          <label className="text-xs text-slate-400 flex items-center gap-1 mb-1.5">
            <Palette className="h-3 w-3" /> Text Color
          </label>
          <div className="flex gap-1.5 flex-wrap">
            {["#ffffff", "#d1d5db", "#94a3b8", "#64748b", "#06D6FF", "#9333EA", "#22c55e", "#f59e0b", "#ef4444"].map((color) => (
              <button
                key={color}
                onClick={() => updateStyle("color", color)}
                className={`w-7 h-7 rounded-md transition-all ${
                  block.styles.color === color ? "ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-800" : ""
                }`}
                style={{ background: color }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Button Colors */}
      {block.type === "button" && (
        <>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Button Color</label>
            <div className="flex gap-1.5 flex-wrap">
              {["#06D6FF", "#9333EA", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899", "#ffffff", "#1e293b"].map((color) => (
                <button
                  key={color}
                  onClick={() => updateStyle("backgroundColor", color)}
                  className={`w-7 h-7 rounded-md border border-slate-600 transition-all ${
                    block.styles.backgroundColor === color ? "ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-800" : ""
                  }`}
                  style={{ background: color }}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Text Color</label>
            <div className="flex gap-1.5">
              {["#080E1E", "#ffffff", "#1e293b"].map((color) => (
                <button
                  key={color}
                  onClick={() => updateStyle("color", color)}
                  className={`w-7 h-7 rounded-md border border-slate-600 transition-all ${
                    block.styles.color === color ? "ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-800" : ""
                  }`}
                  style={{ background: color }}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Border Radius</label>
            <Select
              value={block.styles.borderRadius || "8px"}
              onChange={(e) => updateStyle("borderRadius", e.target.value)}
              options={[
                { value: "0", label: "None" },
                { value: "4px", label: "Small" },
                { value: "8px", label: "Medium" },
                { value: "16px", label: "Large" },
                { value: "9999px", label: "Pill" },
              ]}
            />
          </div>
        </>
      )}

      {/* Spacer Height */}
      {block.type === "spacer" && (
        <div>
          <label className="text-xs text-slate-400 block mb-1.5">Height</label>
          <Select
            value={block.styles.height || "32px"}
            onChange={(e) => updateStyle("height", e.target.value)}
            options={[
              { value: "16px", label: "16px - Small" },
              { value: "24px", label: "24px - Medium" },
              { value: "32px", label: "32px - Normal" },
              { value: "48px", label: "48px - Large" },
              { value: "64px", label: "64px - XL" },
              { value: "96px", label: "96px - XXL" },
            ]}
          />
        </div>
      )}

      {/* Divider Color */}
      {block.type === "divider" && (
        <div>
          <label className="text-xs text-slate-400 block mb-1.5">Divider Color</label>
          <div className="flex gap-1.5">
            {["#1e293b", "#334155", "#475569", "#06D6FF", "#9333EA"].map((color) => (
              <button
                key={color}
                onClick={() => updateStyle("backgroundColor", color)}
                className={`w-7 h-7 rounded-md transition-all ${
                  block.styles.backgroundColor === color ? "ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-800" : ""
                }`}
                style={{ background: color }}
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
        return `<p style="font-size:${block.styles.fontSize};color:${block.styles.color};text-align:${block.styles.textAlign};padding:${block.styles.padding};margin:0;line-height:1.6;white-space:pre-wrap;">${block.content}</p>`;

      case "image":
        return block.src 
          ? `<img src="${block.src}" alt="${block.alt || ""}" style="width:100%;max-width:100%;border-radius:${block.styles.borderRadius};display:block;" />`
          : "";

      case "logo":
        return block.src 
          ? `<div style="text-align:${block.styles.textAlign || "center"};"><img src="${block.src}" alt="${block.alt || "Logo"}" style="width:${block.styles.width};max-width:100%;display:inline-block;" /></div>`
          : "";

      case "button":
        return `<div style="text-align:${block.styles.textAlign};padding:8px 0;">
          <a href="${block.url || "#"}" style="display:inline-block;background:${block.styles.backgroundColor};color:${block.styles.color};font-size:${block.styles.fontSize};font-weight:${block.styles.fontWeight};padding:${block.styles.padding};border-radius:${block.styles.borderRadius};text-decoration:none;">${block.content}</a>
        </div>`;

      case "social":
        const links = block.socialLinks || DEFAULT_SOCIAL_LINKS;
        const socialHtml = links.map(l => 
          `<a href="${l.url}" style="display:inline-block;width:36px;height:36px;background:#334155;border-radius:50%;margin:0 6px;text-align:center;line-height:36px;">
            <img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/${l.platform}.svg" width="18" height="18" style="filter:invert(1);opacity:0.8;vertical-align:middle;" />
          </a>`
        ).join("");
        return `<div style="text-align:${block.styles.textAlign};padding:${block.styles.padding};">${socialHtml}</div>`;

      case "divider":
        return `<div style="padding:${block.styles.padding}"><hr style="border:none;height:${block.styles.height};background:${block.styles.backgroundColor};margin:0;" /></div>`;

      case "spacer":
        return `<div style="height:${block.styles.height};"></div>`;

      case "twoColumn":
        return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:${block.styles.padding};">
          <tr>
            <td width="48%" style="vertical-align:top;padding-right:8px;">${block.leftContent || ""}</td>
            <td width="4%"></td>
            <td width="48%" style="vertical-align:top;padding-left:8px;">${block.rightContent || ""}</td>
          </tr>
        </table>`;

      case "footer":
        return `<div style="font-size:${block.styles.fontSize};color:${block.styles.color};text-align:${block.styles.textAlign};padding:${block.styles.padding};border-top:1px solid #1e293b;">
          <p style="margin:0;">${block.content}</p>
          <p style="margin:8px 0 0;font-size:11px;"><a href="{{unsubscribeUrl}}" style="color:#64748b;">Unsubscribe</a></p>
        </div>`;

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
    @media only screen and (max-width: 600px) {
      .kc-cell { padding: 20px !important; }
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
function TemplateEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  
  const [blocks, setBlocks] = useState<Block[]>([
    { id: genId(), type: "logo", content: "", src: "", styles: { ...DEFAULT_STYLES.logo, textAlign: "center" } },
    { id: genId(), type: "header", content: "Welcome to KIITConnect", styles: DEFAULT_STYLES.header },
    { id: genId(), type: "text", content: "We're excited to have you here. Check out what's new and explore everything we have to offer.", styles: DEFAULT_STYLES.text },
    { id: genId(), type: "button", content: "Get Started →", url: "https://kiitconnect.com", styles: DEFAULT_STYLES.button },
    { id: genId(), type: "spacer", content: "", styles: DEFAULT_STYLES.spacer },
    { id: genId(), type: "social", content: "", socialLinks: DEFAULT_SOCIAL_LINKS, styles: DEFAULT_STYLES.social },
    { id: genId(), type: "footer", content: "© 2024 KIITConnect. All rights reserved.", styles: DEFAULT_STYLES.footer },
  ]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState("Untitled Template");
  const [showPreview, setShowPreview] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showVariableHelp, setShowVariableHelp] = useState(false);
  const [importHtml, setImportHtml] = useState("");
  const [saving, setSaving] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [mobileTab, setMobileTab] = useState<"blocks" | "canvas" | "properties">("canvas");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [history, setHistory] = useState<Block[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Load existing template when editing
  useEffect(() => {
    if (editId) {
      setLoading(true);
      setIsEditing(true);
      fetch(`/api/templates/custom/${editId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.name) {
            setTemplateName(data.name);
          }
          // Parse blocks from mjmlContent (JSON string)
          if (data.mjmlContent) {
            try {
              const parsedBlocks = typeof data.mjmlContent === "string" 
                ? JSON.parse(data.mjmlContent) 
                : data.mjmlContent;
              if (Array.isArray(parsedBlocks) && parsedBlocks.length > 0) {
                setBlocks(parsedBlocks);
              }
            } catch (e) {
              console.error("Failed to parse blocks:", e);
            }
          }
        })
        .catch((err) => {
          console.error("Failed to load template:", err);
          toast.error("Failed to load template");
        })
        .finally(() => setLoading(false));
    }
  }, [editId]);

  const selectedBlock = blocks.find((b) => b.id === selectedId) || null;

  const saveToHistory = (newBlocks: Block[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newBlocks);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setBlocks(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setBlocks(history[historyIndex + 1]);
    }
  };

  const addBlock = (type: BlockType) => {
    const newBlock: Block = {
      id: genId(),
      type,
      content: BLOCK_TYPES.find((b) => b.type === type)?.defaultContent || "",
      styles: { ...DEFAULT_STYLES[type] },
      socialLinks: type === "social" ? DEFAULT_SOCIAL_LINKS : undefined,
    };
    const newBlocks = [...blocks, newBlock];
    setBlocks(newBlocks);
    saveToHistory(newBlocks);
    setSelectedId(newBlock.id);
    setMobileTab("canvas");
  };

  const updateBlock = (id: string, updates: Partial<Block>) => {
    const newBlocks = blocks.map((b) => 
      b.id === id ? { ...b, ...updates, styles: { ...b.styles, ...updates.styles } } : b
    );
    setBlocks(newBlocks);
  };

  const deleteBlock = (id: string) => {
    const newBlocks = blocks.filter((b) => b.id !== id);
    setBlocks(newBlocks);
    saveToHistory(newBlocks);
    if (selectedId === id) setSelectedId(null);
  };

  const duplicateBlock = (id: string) => {
    const index = blocks.findIndex((b) => b.id === id);
    if (index === -1) return;
    const original = blocks[index];
    const duplicate: Block = { ...original, id: genId() };
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, duplicate);
    setBlocks(newBlocks);
    saveToHistory(newBlocks);
    setSelectedId(duplicate.id);
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    const newBlocks = [...blocks];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
    setBlocks(newBlocks);
    saveToHistory(newBlocks);
  };

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
        socialLinks: type === "social" ? DEFAULT_SOCIAL_LINKS : undefined,
      };
      const newBlocks = [...blocks];
      newBlocks.splice(index, 0, newBlock);
      setBlocks(newBlocks);
      saveToHistory(newBlocks);
      setSelectedId(newBlock.id);
    }
    setDragOverIndex(null);
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }
    if (blocks.length === 0) {
      toast.error("Please add at least one block to your template");
      return;
    }
    setSaving(true);
    try {
      const html = generateEmailHtml(blocks, templateName);
      if (!html || html.length < 100) {
        toast.error("Template content is too short");
        setSaving(false);
        return;
      }
      const url = isEditing && editId 
        ? `/api/templates/custom/${editId}` 
        : "/api/templates/custom";
      const method = isEditing && editId ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateName,
          html,
          blocks: JSON.stringify(blocks),
        }),
      });
      if (res.ok) {
        toast.success(isEditing ? "Template updated!" : "Template saved!");
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

  const handleImportHtml = () => {
    if (!importHtml.trim()) {
      toast.error("Please paste your HTML code");
      return;
    }
    // Create a single HTML block with the imported content
    const newBlock: Block = {
      id: genId(),
      type: "text",
      content: "[Imported HTML - View in Code/Preview]",
      styles: DEFAULT_STYLES.text,
    };
    setBlocks([newBlock]);
    setShowImport(false);
    setImportHtml("");
    toast.success("HTML imported! Use Preview to see it.");
  };

  const handleSaveRawHtml = async () => {
    if (!templateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }
    if (!importHtml.trim()) {
      toast.error("Please paste your HTML code");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/templates/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateName,
          html: importHtml,
          blocks: JSON.stringify([{ type: "raw", content: "Imported HTML template" }]),
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
  const categories = [...new Set(BLOCK_TYPES.map(b => b.category))];

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[hsl(var(--background))]">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center pl-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <p className="text-slate-400">Loading template...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[hsl(var(--background))]">
      <Sidebar />
      
      <main className="flex-1 flex flex-col min-w-0 pl-0 md:pl-64">
        {/* Top Bar - Responsive */}
        <header className="h-14 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] flex items-center px-3 md:px-5 gap-2 md:gap-4 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={() => router.push("/templates")} className="hidden sm:flex">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <Button variant="ghost" size="sm" onClick={() => router.push("/templates")} className="sm:hidden p-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div className="hidden sm:block w-px h-6 bg-[hsl(var(--border))]" />
          
          <Input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="flex-1 sm:flex-none sm:w-48 md:w-60 font-semibold text-sm"
            placeholder="Template name..."
          />
          
          <div className="flex-1" />
          
          {/* Undo/Redo - Desktop */}
          <div className="hidden lg:flex items-center gap-1 mr-2">
            <button 
              onClick={undo} 
              disabled={historyIndex <= 0}
              className="p-2 rounded-lg hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-400"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button 
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 rounded-lg hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-400"
            >
              <Redo2 className="h-4 w-4" />
            </button>
          </div>

          <Button variant="outline" size="sm" onClick={() => setShowImport(true)} className="hidden md:flex">
            <Upload className="h-4 w-4 mr-1" /> Import
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowVariableHelp(true)} className="hidden lg:flex">
            <Info className="h-4 w-4 mr-1" /> Variables
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowCode(true)} className="hidden md:flex">
            <Code className="h-4 w-4 mr-1" /> Code
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowPreview(true)} className="hidden md:flex">
            <Eye className="h-4 w-4 mr-1" /> Preview
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowPreview(true)} className="md:hidden p-2">
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={handleSave} isLoading={saving}>
            <Save className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">{isEditing ? "Update" : "Save"}</span>
          </Button>
        </header>

        {/* Mobile Tab Bar */}
        <div className="md:hidden flex border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]">
          <button 
            onClick={() => setMobileTab("blocks")}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              mobileTab === "blocks" ? "text-cyan-400 border-b-2 border-cyan-400" : "text-slate-400"
            }`}
          >
            <Layers className="h-4 w-4" /> Blocks
          </button>
          <button 
            onClick={() => setMobileTab("canvas")}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              mobileTab === "canvas" ? "text-cyan-400 border-b-2 border-cyan-400" : "text-slate-400"
            }`}
          >
            <Monitor className="h-4 w-4" /> Canvas
          </button>
          <button 
            onClick={() => setMobileTab("properties")}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              mobileTab === "properties" ? "text-cyan-400 border-b-2 border-cyan-400" : "text-slate-400"
            }`}
          >
            <Settings className="h-4 w-4" /> Properties
          </button>
        </div>

        {/* Editor Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Block Palette - Desktop sidebar, Mobile full panel */}
          <aside className={`
            ${mobileTab === "blocks" ? "flex" : "hidden"} md:flex
            w-full md:w-52 lg:w-56
            border-r border-[hsl(var(--border))] bg-[hsl(var(--card))]
            flex-col overflow-y-auto flex-shrink-0
          `}>
            <div className="p-3 md:p-4 flex-1">
              {categories.map(cat => (
                <div key={cat} className="mb-4">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">{cat}</div>
                  <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
                    {BLOCK_TYPES.filter(b => b.category === cat).map((block) => (
                      <div
                        key={block.type}
                        draggable
                        onDragStart={(e) => handleDragStart(e, block.type)}
                        onClick={() => addBlock(block.type)}
                        className="flex items-center gap-2 p-2.5 md:p-3 bg-[hsl(var(--accent))] border border-[hsl(var(--border))] rounded-lg cursor-grab hover:border-cyan-500/50 hover:bg-slate-800/50 transition-colors active:cursor-grabbing"
                      >
                        <span className="text-slate-400">{block.icon}</span>
                        <span className="text-xs md:text-sm text-[hsl(var(--foreground))]">{block.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-[hsl(var(--border))] text-[10px] text-slate-500 hidden md:block">
              Drag blocks to canvas or tap to add
            </div>
          </aside>

          {/* Canvas - Desktop always visible, Mobile tab */}
          <div className={`
            ${mobileTab === "canvas" ? "flex" : "hidden"} md:flex
            flex-1 flex-col bg-slate-900 overflow-hidden
          `}>
            <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
              <div 
                className={`mx-auto bg-[#080E1E] border border-slate-800 rounded-xl transition-all duration-300 ${
                  previewMode === "mobile" ? "max-w-[375px]" : "max-w-[600px]"
                }`}
                style={{ minHeight: "400px" }}
              >
                <div className="p-4 md:p-6 lg:p-8">
                  {blocks.length === 0 ? (
                    <div
                      onDragOver={(e) => handleDragOver(e, 0)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, 0)}
                      className={`p-8 md:p-12 text-center text-slate-500 border-2 border-dashed rounded-xl transition-colors ${
                        dragOverIndex === 0 ? "border-cyan-400 bg-cyan-500/5" : "border-slate-700"
                      }`}
                    >
                      <Type className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Drag blocks here or tap a block to add</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {blocks.map((block, index) => (
                        <div key={block.id}>
                          <div
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, index)}
                            className={`transition-all ${
                              dragOverIndex === index 
                                ? "h-12 bg-cyan-500/10 border-2 border-dashed border-cyan-400 rounded-lg mb-2" 
                                : "h-2"
                            }`}
                          />
                          <BlockRenderer
                            block={block}
                            isSelected={selectedId === block.id}
                            onSelect={() => { setSelectedId(block.id); setMobileTab("properties"); }}
                            onDelete={() => deleteBlock(block.id)}
                            onDuplicate={() => duplicateBlock(block.id)}
                            onMoveUp={() => moveBlock(index, "up")}
                            onMoveDown={() => moveBlock(index, "down")}
                            isFirst={index === 0}
                            isLast={index === blocks.length - 1}
                          />
                        </div>
                      ))}
                      <div
                        onDragOver={(e) => handleDragOver(e, blocks.length)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, blocks.length)}
                        className={`transition-all ${
                          dragOverIndex === blocks.length 
                            ? "h-12 bg-cyan-500/10 border-2 border-dashed border-cyan-400 rounded-lg" 
                            : "h-6"
                        }`}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Preview mode toggle - Desktop only */}
            <div className="hidden md:flex items-center justify-center gap-2 p-3 border-t border-slate-800 bg-slate-900/50">
              <button
                onClick={() => setPreviewMode("desktop")}
                className={`p-2 rounded-lg transition-colors ${previewMode === "desktop" ? "bg-slate-700 text-white" : "text-slate-500 hover:text-white"}`}
              >
                <Monitor className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPreviewMode("mobile")}
                className={`p-2 rounded-lg transition-colors ${previewMode === "mobile" ? "bg-slate-700 text-white" : "text-slate-500 hover:text-white"}`}
              >
                <Smartphone className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Properties Panel - Desktop sidebar, Mobile full panel */}
          <aside className={`
            ${mobileTab === "properties" ? "flex" : "hidden"} md:flex
            w-full md:w-64 lg:w-72
            border-l border-[hsl(var(--border))] bg-[hsl(var(--card))]
            flex-col overflow-y-auto flex-shrink-0
          `}>
            <div className="p-3 md:p-4 border-b border-[hsl(var(--border))]">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Properties</div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <PropertiesPanel
                block={selectedBlock}
                onChange={(updates) => selectedId && updateBlock(selectedId, updates)}
              />
            </div>
            {selectedBlock && (
              <div className="p-3 border-t border-[hsl(var(--border))] md:hidden">
                <Button variant="outline" className="w-full" onClick={() => setMobileTab("canvas")}>
                  Back to Canvas
                </Button>
              </div>
            )}
          </aside>
        </div>
      </main>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="w-full max-w-3xl h-[90vh] bg-[hsl(var(--card))] rounded-xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-[hsl(var(--border))] flex items-center justify-between gap-4">
              <span className="font-semibold truncate">{templateName}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewMode("desktop")}
                  className={`p-2 rounded-lg transition-colors ${previewMode === "desktop" ? "bg-slate-700 text-white" : "text-slate-500 hover:text-white"}`}
                >
                  <Monitor className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPreviewMode("mobile")}
                  className={`p-2 rounded-lg transition-colors ${previewMode === "mobile" ? "bg-slate-700 text-white" : "text-slate-500 hover:text-white"}`}
                >
                  <Smartphone className="h-4 w-4" />
                </button>
                <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>Close</Button>
              </div>
            </div>
            <div className="flex-1 bg-slate-800 p-4 flex justify-center overflow-auto">
              <iframe
                srcDoc={generatedHtml}
                className={`bg-[#080E1E] rounded-lg border border-slate-700 transition-all duration-300 ${
                  previewMode === "mobile" ? "w-[375px]" : "w-full max-w-[600px]"
                }`}
                style={{ height: "100%", minHeight: "500px" }}
                title="Email Preview"
              />
            </div>
          </div>
        </div>
      )}

      {/* Code Modal */}
      {showCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="w-full max-w-4xl h-[90vh] bg-[hsl(var(--card))] rounded-xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-[hsl(var(--border))] flex items-center justify-between gap-4">
              <span className="font-semibold">HTML Code</span>
              <div className="flex gap-2">
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
            <pre className="flex-1 overflow-auto p-4 m-0 text-xs font-mono text-slate-400 bg-slate-900">
              {generatedHtml}
            </pre>
          </div>
        </div>
      )}

      {/* Import HTML Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] bg-[hsl(var(--card))] rounded-xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-[hsl(var(--border))] flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-lg">Import HTML Template</h2>
                <p className="text-sm text-slate-400">Paste your custom HTML email template below</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowImport(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-4 border-b border-[hsl(var(--border))] bg-slate-800/30">
              <div className="flex items-start gap-3 text-sm">
                <Info className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-slate-300">Use these variables in your HTML for personalization:</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    <code className="bg-slate-900 px-2 py-1 rounded text-cyan-400">{"{{firstName}}"}</code>
                    <code className="bg-slate-900 px-2 py-1 rounded text-cyan-400">{"{{lastName}}"}</code>
                    <code className="bg-slate-900 px-2 py-1 rounded text-cyan-400">{"{{email}}"}</code>
                    <code className="bg-slate-900 px-2 py-1 rounded text-cyan-400">{"{{ctaUrl}}"}</code>
                    <code className="bg-slate-900 px-2 py-1 rounded text-cyan-400">{"{{ctaText}}"}</code>
                    <code className="bg-slate-900 px-2 py-1 rounded text-cyan-400">{"{{unsubscribeUrl}}"}</code>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-hidden flex flex-col">
              <label className="text-sm text-slate-400 mb-2">Paste your HTML code:</label>
              <textarea
                value={importHtml}
                onChange={(e) => setImportHtml(e.target.value)}
                className="flex-1 w-full bg-slate-900 border border-slate-700 rounded-lg p-4 text-sm font-mono text-slate-300 resize-none focus:outline-none focus:border-cyan-500"
                placeholder={`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Email</title>
</head>
<body style="margin:0;padding:0;background:#080E1E;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <h1 style="color:#ffffff;">Hello {{firstName}}!</h1>
        <p style="color:#d1d5db;">Your personalized content here...</p>
        <a href="{{ctaUrl}}" style="background:#06D6FF;color:#080E1E;padding:14px 32px;border-radius:8px;text-decoration:none;display:inline-block;">
          {{ctaText}}
        </a>
        <p style="color:#64748b;font-size:12px;margin-top:32px;">
          <a href="{{unsubscribeUrl}}" style="color:#64748b;">Unsubscribe</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`}
              />
            </div>

            <div className="p-4 border-t border-[hsl(var(--border))] flex items-center justify-between gap-4">
              <Button variant="outline" onClick={() => setShowVariableHelp(true)}>
                <Info className="h-4 w-4 mr-1" /> Variable Guide
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowImport(false)}>Cancel</Button>
                <Button onClick={handleSaveRawHtml} isLoading={saving}>
                  <Save className="h-4 w-4 mr-1" /> Save Template
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Variable Help Modal */}
      {showVariableHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] bg-[hsl(var(--card))] rounded-xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-[hsl(var(--border))] flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-lg">Template Variables Guide</h2>
                <p className="text-sm text-slate-400">Use these placeholders in your HTML templates</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowVariableHelp(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-auto p-4 space-y-6">
              {/* Contact Variables */}
              <div>
                <h3 className="font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Contact Variables
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <div>
                      <code className="text-cyan-400 font-mono">{"{{firstName}}"}</code>
                      <p className="text-xs text-slate-400 mt-1">Contact's first name</p>
                    </div>
                    <span className="text-xs text-slate-500">e.g., "Ranjit"</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <div>
                      <code className="text-cyan-400 font-mono">{"{{lastName}}"}</code>
                      <p className="text-xs text-slate-400 mt-1">Contact's last name</p>
                    </div>
                    <span className="text-xs text-slate-500">e.g., "Kumar"</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <div>
                      <code className="text-cyan-400 font-mono">{"{{email}}"}</code>
                      <p className="text-xs text-slate-400 mt-1">Contact's email address</p>
                    </div>
                    <span className="text-xs text-slate-500">e.g., "user@kiit.ac.in"</span>
                  </div>
                </div>
              </div>

              {/* CTA Variables */}
              <div>
                <h3 className="font-semibold text-purple-400 mb-3 flex items-center gap-2">
                  <Link className="h-4 w-4" /> Call-to-Action Variables
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <div>
                      <code className="text-purple-400 font-mono">{"{{ctaUrl}}"}</code>
                      <p className="text-xs text-slate-400 mt-1">Button/link destination URL</p>
                    </div>
                    <span className="text-xs text-slate-500">e.g., "https://kiitconnect.com/signup"</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <div>
                      <code className="text-purple-400 font-mono">{"{{ctaText}}"}</code>
                      <p className="text-xs text-slate-400 mt-1">Button/link text</p>
                    </div>
                    <span className="text-xs text-slate-500">e.g., "Get Started →"</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <div>
                      <code className="text-purple-400 font-mono">{"{{headline}}"}</code>
                      <p className="text-xs text-slate-400 mt-1">Optional headline text</p>
                    </div>
                    <span className="text-xs text-slate-500">e.g., "Special Offer!"</span>
                  </div>
                </div>
              </div>

              {/* System Variables */}
              <div>
                <h3 className="font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                  <Settings className="h-4 w-4" /> System Variables (Auto-generated)
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <div>
                      <code className="text-emerald-400 font-mono">{"{{unsubscribeUrl}}"}</code>
                      <p className="text-xs text-slate-400 mt-1">Unique unsubscribe link (required for compliance)</p>
                    </div>
                    <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">Auto</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <div>
                      <code className="text-emerald-400 font-mono">{"{{trackingPixel}}"}</code>
                      <p className="text-xs text-slate-400 mt-1">Open tracking pixel (auto-injected)</p>
                    </div>
                    <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">Auto</span>
                  </div>
                </div>
              </div>

              {/* Example Template */}
              <div>
                <h3 className="font-semibold text-amber-400 mb-3 flex items-center gap-2">
                  <FileCode className="h-4 w-4" /> Example HTML Template
                </h3>
                <pre className="bg-slate-900 p-4 rounded-lg text-xs font-mono text-slate-400 overflow-auto">
{`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>Your Email Subject</title>
</head>
<body style="margin:0;padding:0;background:#080E1E;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#080E1E;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="background:#080E1E;padding:32px;border-radius:16px;border:1px solid #1e293b;">
              
              <!-- Logo -->
              <img src="YOUR_LOGO_URL" alt="Logo" width="120" style="display:block;margin:0 auto 24px;">
              
              <!-- Heading -->
              <h1 style="color:#ffffff;font-size:28px;text-align:center;margin:0 0 16px;">
                Hello {{firstName}}!
              </h1>
              
              <!-- Body Text -->
              <p style="color:#d1d5db;font-size:16px;line-height:1.6;text-align:center;margin:0 0 24px;">
                Welcome to KIITConnect. We're excited to have you join our community.
              </p>
              
              <!-- CTA Button -->
              <div style="text-align:center;margin:24px 0;">
                <a href="{{ctaUrl}}" style="background:#06D6FF;color:#080E1E;font-size:14px;font-weight:700;padding:14px 32px;border-radius:8px;text-decoration:none;display:inline-block;">
                  {{ctaText}}
                </a>
              </div>
              
              <!-- Footer -->
              <div style="border-top:1px solid #1e293b;padding-top:24px;margin-top:32px;text-align:center;">
                <p style="color:#64748b;font-size:12px;margin:0;">
                  © 2024 KIITConnect. All rights reserved.
                </p>
                <p style="margin:8px 0 0;">
                  <a href="{{unsubscribeUrl}}" style="color:#64748b;font-size:11px;">Unsubscribe</a>
                </p>
              </div>
              
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`}
                </pre>
              </div>
            </div>

            <div className="p-4 border-t border-[hsl(var(--border))] flex justify-end">
              <Button onClick={() => setShowVariableHelp(false)}>Got it!</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Wrapper with Suspense for useSearchParams
export default function TemplateEditorPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-[hsl(var(--background))]">Loading editor...</div>}>
      <TemplateEditor />
    </Suspense>
  );
}
