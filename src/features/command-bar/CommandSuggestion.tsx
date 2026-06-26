export interface SuggestionItem {
  label: string
  onApply: () => void
}

interface CommandSuggestionProps {
  items: SuggestionItem[]
}

export function CommandSuggestion({ items }: CommandSuggestionProps) {
  if (!items.length) return null
  return (
    <div className="flex gap-2 px-3 py-2 overflow-x-auto">
      {items.map((item, i) => (
        <button
          key={i}
          type="button"
          className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm text-white/75 bg-white/6 border border-dashed border-white/30 hover:bg-white/10 hover:text-white/90 transition-colors"
          onMouseDown={e => { e.preventDefault(); item.onApply() }}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
