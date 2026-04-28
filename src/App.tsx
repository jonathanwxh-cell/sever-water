import { Routes, Route } from 'react-router'
import Game from './components/Game'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Game />} />
    </Routes>
  )
}
