import React, { useState } from 'react'
import AddModel from './addModel'
import Workbench from './workbench'
import './style.css'

export default function App() {

  const [model, setModel] = useState(null);

  return (
    <div>
      <Workbench model={model}/>
      <AddModel addFn={setModel}/>
    </div>
  )
}
