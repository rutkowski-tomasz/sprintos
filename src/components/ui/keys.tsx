interface KeysProps {
  k: string
  meta?: boolean
  shift?: boolean
  alt?: boolean
}

const isLetter = (s: string) => /^[a-zA-Z]$/.test(s)

function Kbd({ children, large }: { children: React.ReactNode; large?: boolean }) {
  return (
    <kbd className={
      large
        ? 'inline-flex items-center justify-center rounded border border-border/60 bg-muted px-1.5 py-[1px] text-lg font-mono text-muted-foreground leading-none'
        : 'inline-flex items-center justify-center rounded border border-border/60 bg-muted px-1.5 py-1 text-xs font-mono text-muted-foreground leading-none'
    }>
      {children}
    </kbd>
  )
}

export function Keys({ k, meta, shift, alt }: KeysProps) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {meta && <Kbd large>⌘</Kbd>}
      {shift && <Kbd large>⇧</Kbd>}
      {alt && <Kbd large>⌥</Kbd>}
      <Kbd large={!isLetter(k)}>{k}</Kbd>
    </span>
  )
}
