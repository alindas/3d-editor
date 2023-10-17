import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  // 严格模式下组件渲染两次
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
