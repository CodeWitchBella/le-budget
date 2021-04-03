import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useAsyncStorage } from '@react-native-async-storage/async-storage'

const used = new Set()

type StorageAction<T> = T extends Function ? never : T | ((prev: T) => T)
type StorageDispatch<T extends {}> = (value: StorageAction<T>) => void
type StorageTuple<T> = readonly [T | undefined, StorageDispatch<T>]
export function useSimpleStorage<T extends {}>(
  key: string,
  initialValue: T,
): StorageTuple<T> {
  const [state, setState] = useState<T | undefined>(undefined)
  const storage = useAsyncStorage(key)
  const initialValueRef = useRef(initialValue)

  // bug-prevention
  useEffect(() => {
    if (used.has(key))
      throw new Error('useStorage cannot be used multiple times with same key')
    used.add(key)
    return () => {
      used.delete(key)
    }
  }, [key])

  // load
  useEffect(() => {
    storage.getItem((error, item) => {
      if (error) return
      setState((prevValue) => {
        if (prevValue !== undefined) return prevValue
        return item != null ? JSON.parse(item) : initialValueRef.current
      })
    })
  }, [setState, storage])

  const setValue = useCallback<StorageDispatch<T>>(
    (value) => {
      setState((prevValue) => {
        const realPrevValue =
          prevValue === undefined ? initialValueRef.current : prevValue
        const nextValue =
          typeof value === 'function' ? value(realPrevValue) : value

        storage.setItem(JSON.stringify(nextValue))
        return nextValue
      })
    },
    [storage],
  )
  return useMemo(() => [state, setValue], [state, setValue])
}

export function createStorageStore<T>(key: string, initialValue: T) {
  if (initialValue === undefined || initialValue === null) {
    throw new Error('Initial value must not be null nor undefined')
  }
  const valueContext = createContext<StorageTuple<T>[0] | null>(null)
  const dispatchContext = createContext<StorageTuple<T>[1] | null>(null)
  function Provider({ children }: PropsWithChildren<{}>) {
    const tuple = useSimpleStorage(key, initialValue)
    if (tuple[0] === undefined) return null
    return (
      <valueContext.Provider value={tuple[0]}>
        <dispatchContext.Provider value={tuple[1]}>
          {children}
        </dispatchContext.Provider>
      </valueContext.Provider>
    )
  }
  function useStorage() {
    const val = useContext(valueContext)
    if (val === null)
      throw new Error('Missing value provider for storageContext key=' + key)
    return val
  }
  function useDispatch() {
    const val = useContext(dispatchContext)
    if (val === null)
      throw new Error('Missing dipsatch provider for storageContext key=' + key)
    return val
  }
  function createUpdaterHook<Action>(
    reducer: (action: Action, prevValue: T) => T,
  ) {
    return function useUpdater() {
      const dispatch = useDispatch()
      return useCallback(
        (action: Action) => {
          const storageAction: any = (v: T) => reducer(action, v)
          dispatch(storageAction)
        },
        [dispatch],
      )
    }
  }

  return {
    Provider,
    useStorage,
    useDispatch,
    createUpdaterHook,
  } as const
}
