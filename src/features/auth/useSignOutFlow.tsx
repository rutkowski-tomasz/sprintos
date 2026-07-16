import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { pendingSyncCount, signOut } from './signOut'

export function useSignOutFlow() {
  const [pending, setPending] = useState<number | null>(null)

  async function requestSignOut() {
    const count = await pendingSyncCount()
    if (count > 0) {
      setPending(count)
      return
    }
    signOut()
  }

  const dialog = (
    <Dialog open={pending !== null} onOpenChange={open => !open && setPending(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unsynced changes</DialogTitle>
          <DialogDescription>
            You have {pending} unsynced change{pending === 1 ? '' : 's'} that will be lost. Sign out anyway?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setPending(null)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              setPending(null)
              signOut()
            }}
          >
            Sign out
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  return { requestSignOut, dialog }
}
