import { platformStore } from './platform-store'

const globalRuntime = globalThis as typeof globalThis & {
  __atlasRuntimeStarted?: boolean
}

export const bootstrapPlatformRuntime = () => {
  if (globalRuntime.__atlasRuntimeStarted) {
    return
  }
  globalRuntime.__atlasRuntimeStarted = true
  setInterval(() => {
    platformStore.tickJobs()
  }, 4000).unref?.()
}
