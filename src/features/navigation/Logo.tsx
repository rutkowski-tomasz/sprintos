import { useId } from 'react'

const BOLT_PATH = 'M303,92 Q310,68 290,87 L114,257 Q94,276 126,276 L213,276 Q245,276 236,299 L184,421 Q175,444 197,426 L396,254 Q418,236 386,236 L299,236 Q267,236 274,213 Z'
const HIGHLIGHT_PATH_1 = 'M303,92 Q310,68 290,87 L114,257 Q94,276 126,276 L129,276'
const HIGHLIGHT_PATH_2 = 'M299,236 Q267,236 274,213'

export function Logo({ size = 28, monochrome = false }: { size?: number; monochrome?: boolean }) {
  const id = useId()
  const gm = `${id}gm`
  const gg = `${id}gg`
  const glow = `${id}glow`

  if (monochrome) {
    return (
      <svg width={size} height={size} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d={BOLT_PATH} fill="currentColor" />
        <path d={HIGHLIGHT_PATH_1} fill="none" stroke="currentColor" strokeWidth={5} strokeLinecap="round" opacity={0.35} />
        <path d={HIGHLIGHT_PATH_2} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" opacity={0.35} />
      </svg>
    )
  }

  return (
    <svg width={size} height={size} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id={gm} x1="35%" y1="0%" x2="65%" y2="100%">
          <stop offset="0%"   stopColor="#f5f0ff"/>
          <stop offset="35%"  stopColor="#c084fc"/>
          <stop offset="100%" stopColor="#4c1d95"/>
        </linearGradient>
        <radialGradient id={gg} cx="32%" cy="16%" r="58%">
          <stop offset="0%"   stopColor="white" stopOpacity={0.52}/>
          <stop offset="55%"  stopColor="white" stopOpacity={0.07}/>
          <stop offset="100%" stopColor="white" stopOpacity={0}/>
        </radialGradient>
        <filter id={glow} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx={0} dy={5} stdDeviation={22} floodColor="#a855f7" floodOpacity={0.6}/>
        </filter>
      </defs>
      <path d={BOLT_PATH} fill="#a855f7" filter={`url(#${glow})`} opacity={0.7} />
      <path d={BOLT_PATH} fill={`url(#${gm})`} />
      <path d={BOLT_PATH} fill={`url(#${gg})`} />
      <path d={HIGHLIGHT_PATH_1} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={5} strokeLinecap="round" />
      <path d={HIGHLIGHT_PATH_2} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth={3} strokeLinecap="round" />
    </svg>
  )
}
