import { useState } from 'react'
import './App.css'
import LoadScreen from './screens/LoadScreen'
import SearchScreen from './screens/SearchScreen'

function App() {
  const [database, setDatabase] = useState(null)

  if (!database) {
    return <LoadScreen onLoaded={setDatabase} />
  }

  return <SearchScreen database={database} onReset={() => setDatabase(null)} />
}

export default App
