import React, { useEffect } from 'react'
import * as THREE from 'three';
import './effect.css'

export default function Effect() {

  useEffect(() => {
    const A = new THREE.Vector3(30, 30, 0);// 人起点A
    // walk表示运动的位移量用向量
    const walk = new THREE.Vector3(100, 50, 0);
    const B = new THREE.Vector3();// 人运动结束点B
    // 计算结束点xyz坐标
    // B.x = A.x + walk.x;
    // B.y = A.y + walk.y;
    // B.z = A.z + walk.z;
    B.addVectors(A, walk)
    console.log('B', B);

  }, [])

  function handleSwitch(e) {
    // bug
    return
    // console.log('here', e.checked)
    // console.log('here', e.target.value)
    console.log('here', e.target.checked)
    // 关闭时移除效果
    if (!e.target.checked) {
      return
    }
    // 创建喷火枪特效的粒子系统
    let fireTexture = new THREE.TextureLoader().load('path/to/fire_texture.png');
    let fireMaterial = new THREE.PointsMaterial({
      size: 0.2,
      map: fireTexture,
      blending: THREE.AdditiveBlending,
      transparent: true
    });
    let fireGeometry = new THREE.BufferGeometry();

    // 定义顶点数据
    const positions = new Float32Array([
      -0.5, -0.5, 0,  // 顶点1的位置
      0.5, -0.5, 0,   // 顶点2的位置
      0, 0.5, 0       // 顶点3的位置
    ]);

    // 将顶点数据存储到 geometry 对象中
    fireGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // 创建粒子系统对象
    let fireParticles = new THREE.Points(fireGeometry, fireMaterial);
    window.scene.add(fireParticles);

    // 控制粒子系统的动画效果
    function animate() {
      requestAnimationFrame(animate);

      // 更新粒子的位置和大小
      for (var i = 0; i < fireGeometry.vertices.length; i++) {
        var particle = fireGeometry.vertices[i];
        particle.y += Math.random() * 0.1;
        if (particle.y > 2) {
          particle.y = 0;
        }
      }
      fireParticles.geometry.verticesNeedUpdate = true;

    }
    animate();

  }

  return (
    <div className='effect-box'>
      <label>
        <input onChange={handleSwitch} name="dummy" type="checkbox" className="bubble" />
      </label>
    </div>
  )
}
