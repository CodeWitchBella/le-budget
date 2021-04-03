import { StatusBar } from "expo-status-bar"
import { useEffect, useMemo, useReducer, useState } from "react"
import * as React from "react"
import { View, StyleSheet, Text, FlatList, ScrollView } from "react-native"
import { Button, TextInput } from "react-native-paper"
import { useSimpleStorage } from "./use-storage"
import { DateTime } from "luxon"

type Change = {
  amount: number
  description: string
  time: string
  id: number
}
type State = readonly Change[]

export function App({ val, onChange }: { val: any; onChange: any }) {
  const [state, dispatch] = useReducer(
    (
      state: State,
      action:
        | { type: "push"; value: Omit<Change, "id"> }
        | { type: "reset" }
        | { type: "delete"; id: number }
    ) => {
      if (action.type === "reset") return []
      if (action.type === "delete") {
        const idx = state.findIndex((item) => item.id === action.id)
        if (idx < 0) return state
        return state.slice(0, idx).concat(state.slice(idx + 1))
      }
      return [
        {
          ...action.value,
          id: state.reduce((a, b) => Math.max(a, b.id), 0) + 1,
        },
        ...state,
      ]
    },
    val
  )
  useEffect(() => {
    onChange(state)
  }, [state])

  const balance = useMemo(() => state.reduce((a, b) => a + b.amount, 0), [
    state,
  ])
  const [inputText, setInputText] = useState("")
  const [descInput, setDescInput] = useState("")
  const [_, forceUpdate] = useReducer((a) => a + 1, 0)

  return (
    <View style={{ padding: 8 }}>
      <StatusBar style="auto" />
      <Text style={{ fontSize: 20 }}>Your balance: {balance}</Text>
      <TextInput
        mode="flat"
        style={{ flexGrow: 1, marginRight: 8 }}
        keyboardType="numeric"
        value={inputText}
        onChangeText={(value) => {
          if (
            !value ||
            value === "-" ||
            Number.isFinite(Number.parseFloat(value.replace(/ /g, "")))
          ) {
            setInputText(value)
          }
        }}
      />
      <TextInput
        mode="flat"
        style={{ flexGrow: 1, marginRight: 8 }}
        value={descInput}
        onChangeText={(value) => {
          setDescInput(value)
        }}
      />
      <Button
        mode="contained"
        onPress={() => {
          setDescInput("")
          setInputText("")
          dispatch({
            type: "push",
            value: {
              description: descInput,
              amount: Number.parseFloat(inputText.replace(/ /g, "")),
              time: DateTime.local().toISO(),
            },
          })
        }}
      >
        <Text>Add</Text>
      </Button>
      <FlatList
        data={state}
        renderItem={({ item }) => (
          <View key={item.id + ""}>
            <Text>Change: {item.amount}</Text>
            <Text>Description: {item.description}</Text>
            <Text>DateTime: {DateTime.fromISO(item.time).toRelative()}</Text>
            <Button
              onPress={() => {
                dispatch({ type: "delete", id: item.id })
              }}
            >
              <Text>Delete</Text>
            </Button>
          </View>
        )}
        scrollEnabled={true}
        refreshing={false}
        onRefresh={forceUpdate}
        keyExtractor={(item) => item.id + ""}
      />
    </View>
  )
}
