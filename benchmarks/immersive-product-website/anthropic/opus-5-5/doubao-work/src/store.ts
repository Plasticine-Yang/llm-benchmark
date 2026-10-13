import { useSyncExternalStore } from 'react'
import type { FinishId } from './data'

/** Tiny external stores so that only subscribers re-render (not the whole page). */
function createStore<T>(initial: T) {
  let value = initial
  const listeners = new Set<() => void>()
  return {
    get: () => value,
    set: (next: T) => {
      if (Object.is(next, value)) return
      value = next
      listeners.forEach((l) => l())
    },
    subscribe: (l: () => void) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
  }
}

export const finishStore = createStore<FinishId>('obsidian')

export function setFinish(id: FinishId) {
  finishStore.set(id)
  document.documentElement.dataset.finish = id
}

export function useFinish() {
  return useSyncExternalStore(finishStore.subscribe, finishStore.get, finishStore.get)
}

/* Dialog triggers: components call open*(originElement); dialogs subscribe. */
type DialogRequest = { open: boolean; origin: HTMLElement | null }
export const reserveStore = createStore<DialogRequest>({ open: false, origin: null })
export const storyStore = createStore<DialogRequest>({ open: false, origin: null })

export const openReservation = (origin: HTMLElement | null) => reserveStore.set({ open: true, origin })
export const closeReservation = () => reserveStore.set({ open: false, origin: reserveStore.get().origin })
export const openStory = (origin: HTMLElement | null) => storyStore.set({ open: true, origin })
export const closeStory = () => storyStore.set({ open: false, origin: storyStore.get().origin })

export function useDialogRequest(store: typeof reserveStore) {
  return useSyncExternalStore(store.subscribe, store.get, store.get)
}
