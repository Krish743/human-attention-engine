import { createContext, useContext, useState } from 'react'
const SettingsCtx = createContext(null)
export function SettingsProvider({ children }) {
  const [gtWeight, setGtWeight] = useState(0.7)
  const [corrThreshold, setCorrThreshold] = useState(0.7)
  return <SettingsCtx.Provider value={{ gtWeight, setGtWeight, corrThreshold, setCorrThreshold }}>{children}</SettingsCtx.Provider>
}
export function useSettings() { return useContext(SettingsCtx) }