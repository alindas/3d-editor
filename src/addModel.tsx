import React from 'react'
import * as THREE from 'three';
import nProgress from 'nprogress';
import 'nprogress/nprogress.css'
// import FBXLoader from './utils/three-correct/fbxloader'; require 不可用
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'

export default function AddModel(props) {

  function addFile() {
    document.getElementById('model-file').click();
  }

  function loaderModels(ev: any) {
    if (ev.target.files === null) {
      return
    }
    let group = new THREE.Group();
    const loader = new FBXLoader();
    let count = 0;
    nProgress.set(0.0);
    // nProgress.start();
    try {
      for(let obj of ev.target.files) {
        // 导入模拟模型
        loader.load(
          window.URL.createObjectURL(obj),
          (model: any) => {

            model.traverse((child: any) => {
              if (child.isMesh) {
                child.material.side = THREE.DoubleSide;
              }
            });
            count++;
            nProgress.set(count / ev.target.files.length);
            model.name = model.name.split(/\.\w+$/)[0];
            group.add(model);
            if (count === ev.target.files.length) { // 全部加载完
              props.addFn(group);
              // nProgress.done();

            }
          },
          () => {},
          (event) => {
            console.error(event);
            window.alert(
              '模型出错，请检查文件对象',
            );
            nProgress.done();
          },
        );
      }
    } catch(err) {
      console.error(err);
      window.alert(
        '上传模型出错',
      );
      nProgress.done();
    }
  }

  return (
    <div onClick={addFile} className='add-btn'>
      <input multiple type="file" id="model-file" onChange={loaderModels} hidden/>
    </div>
  )
}
