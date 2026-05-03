// app/lib/puter.ts

import { create } from 'zustand'

declare global {
  interface Window {
    puter: any
  }
}

interface PuterStore {
  isLoading: boolean
  error: string | null
  puterReady: boolean

  auth: {
    user: any
    isAuthenticated: boolean
    signIn: () => Promise<void>
    signOut: () => Promise<void>
    refreshUser: () => Promise<void>
    checkAuthStatus: () => Promise<boolean>
    getUser: () => any
  }

  fs: {
    upload: (files: File[] | Blob[]) => Promise<any>
    write: (
      path: string,
      data: string | File | Blob
    ) => Promise<any>
    read: (path: string) => Promise<any>
    delete: (path: string) => Promise<any>
    readDir: (path: string) => Promise<any>
  }

  ai: {
    feedback: (
      path: string,
      message: string
    ) => Promise<any>
  }

  kv: {
    get: (key: string) => Promise<any>
    set: (
      key: string,
      value: string
    ) => Promise<any>
  }

  init: () => void
}

const getPuter = () =>
  typeof window !== 'undefined'
    ? window.puter
    : null

export const usePuterStore =
  create<PuterStore>((set, get) => {
    const init = () => {
      const check = setInterval(() => {
        if (getPuter()) {
          clearInterval(check)

          set({
            puterReady: true,
            isLoading: false,
          })

          get()
            .auth.checkAuthStatus()
            .catch(() => {})
        }
      }, 300)
    }

    const checkAuthStatus =
      async (): Promise<boolean> => {
        const puter = getPuter()

        if (!puter) return false

        try {
          const signed =
            await puter.auth.isSignedIn()

          if (signed) {
            const user =
              await puter.auth.getUser()

            set({
              auth: {
                ...get().auth,
                user,
                isAuthenticated: true,
              },
            })

            return true
          }

          return false
        } catch {
          return false
        }
      }

    const signIn = async () => {
      const puter = getPuter()
      if (!puter) return

      await puter.auth.signIn()
      await checkAuthStatus()
    }

    const signOut = async () => {
      const puter = getPuter()
      if (!puter) return

      await puter.auth.signOut()

      set({
        auth: {
          ...get().auth,
          user: null,
          isAuthenticated: false,
        },
      })
    }

    const refreshUser =
      async (): Promise<void> => {
        await checkAuthStatus()
      }

    return {
      isLoading: true,
      error: null,
      puterReady: false,

      auth: {
        user: null,
        isAuthenticated: false,
        signIn,
        signOut,
        refreshUser,
        checkAuthStatus,
        getUser: () =>
          get().auth.user,
      },

      fs: {
        upload: async files =>
          getPuter().fs.upload(
            files
          ),

        write: async (
          path,
          data
        ) =>
          getPuter().fs.write(
            path,
            data
          ),

        read: async path =>
          getPuter().fs.read(path),

        delete: async path =>
          getPuter().fs.delete(
            path
          ),

        readDir: async path =>
          getPuter().fs.readdir(
            path
          ),
      },

      ai: {
        feedback: async (
          path,
          message
        ) =>
          getPuter().ai.chat(
            [
              {
                role: 'user',
                content: [
                  {
                    type: 'file',
                    puter_path: path,
                  },
                  {
                    type: 'text',
                    text: message,
                  },
                ],
              },
            ],
            {
              model:
                'claude-sonnet-4',
            }
          ),
      },

      kv: {
        get: async key =>
          getPuter().kv.get(key),

        set: async (
          key,
          value
        ) =>
          getPuter().kv.set(
            key,
            value
          ),
      },

      init,
    }
  })