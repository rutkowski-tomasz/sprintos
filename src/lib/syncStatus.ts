type Listener = () => void

let flushing = false
const subs = new Set<Listener>()

export const syncFlushState = {
  get isFlushing() {
    return flushing
  },
  setFlushing(v: boolean) {
    flushing = v
    subs.forEach(fn => fn())
  },
  subscribe(fn: Listener) {
    subs.add(fn)
    return () => { subs.delete(fn) }
  },
}
