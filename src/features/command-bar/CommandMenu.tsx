import type { CommandDef } from './commands'

interface CommandMenuProps {
  commands: CommandDef[]
  selectedIndex: number
  onSelect: (command: CommandDef) => void
}

export function CommandMenu({ commands, selectedIndex, onSelect }: CommandMenuProps) {
  if (!commands.length) return null
  return (
    <div className="bn-cmd-menu bn-suggestions rounded-xl" role="listbox" aria-label="Commands">
      {commands.map((cmd, i) => (
        <div
          key={cmd.key}
          role="option"
          aria-selected={i === selectedIndex}
          className={`bn-cmd-row${i === selectedIndex ? ' bn-cmd-row-selected' : ''}`}
          onMouseDown={e => { e.preventDefault(); onSelect(cmd) }}
        >
          <span className="bn-cmd-token">{cmd.token}</span>
          <span className="bn-cmd-desc">{cmd.description}</span>
        </div>
      ))}
    </div>
  )
}
