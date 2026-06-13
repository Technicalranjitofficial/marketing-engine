export default function Loading() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar skeleton */}
      <div className="w-64 border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] flex-shrink-0">
        <div className="p-4 border-b border-[hsl(var(--border))]">
          <div className="h-8 w-32 bg-[hsl(var(--muted))] rounded" />
        </div>
        <div className="p-3 space-y-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div 
              key={i} 
              className="h-10 rounded-lg bg-[hsl(var(--muted)/0.5)]"
              style={{ width: `${70 + Math.random() * 30}%` }}
            />
          ))}
        </div>
      </div>
      
      {/* Main content skeleton */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] px-6 flex items-center">
          <div className="h-6 w-48 bg-[hsl(var(--muted))] rounded" />
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div 
                key={i}
                className="h-24 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]"
              />
            ))}
          </div>
          <div className="h-64 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]" />
        </div>
      </div>
    </div>
  );
}
