import React, { useState } from 'react'
import AddModel from './components/addModel'
import Workbench from './components/workbench'
import './style.css'
import Effect from './components/effect';

export default function App() {

  const [model, setModel] = useState(null);

  return (
    <div>
      <Workbench model={model}/>
      <AddModel addFn={setModel}/>
      <Effect />
    </div>
  )
}
