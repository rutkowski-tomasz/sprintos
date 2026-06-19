import { useState } from 'react'
import { motion } from 'motion/react'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="flex flex-col items-center gap-6 text-center"
      >
        <CheckCircle2 className="size-12 text-primary" />
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          SprintOS
        </h1>
        <p className="text-sm text-muted-foreground">
          Tailwind · shadcn/ui · motion · lucide-react
        </p>
        <Button onClick={() => setCount(c => c + 1)}>
          Clicked {count} {count === 1 ? 'time' : 'times'}
        </Button>
      </motion.div>
    </div>
  )
}
