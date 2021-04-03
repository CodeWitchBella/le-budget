import * as React from "react"
import { App } from "./src/app"
import { SafeAreaView } from "react-native-safe-area-context"
import { useAsyncStorage } from "@react-native-async-storage/async-storage"
import { useEffect, useState } from "react"

export default function Main() {
  const storage = useAsyncStorage("store")
  const [val, setVal] = useState<readonly any[] | null>(null)
  useEffect(() => {
    storage.getItem().then((value) => setVal(JSON.parse(value || "[]")))
  }, [])
  const onChange = React.useCallback(
    (value: any) => {
      storage.setItem(JSON.stringify(value))
    },
    [storage]
  )
  if (!val) return null
  return (
    <SafeAreaView>
      <App val={val} onChange={onChange} />
    </SafeAreaView>
  )
}
