import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import TWEEN from '@tweenjs/tween.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib';

import debounce from '../utils/debounce';
import ThreeD from '../utils/globalThreeD';
import { OutlinePass } from '../utils/three-correct/outlinePass';
import { makeTextTexture } from '../utils/three';
import { isUndefinedOrNull, getClientXY } from '../utils/common';
 //方法：根据文件名获取文件类型
export type TMode = 'translate' | 'rotate' | 'scale';

const NEAR = 0.1,
  FAR = 50000;
let scene: THREE.Scene,
  axesScene: THREE.Scene,
  orbitControl: any,
  axesControl: any,
  transformControl: any,
  mouse: any = new THREE.Vector2(),
  raycaster: any, // 点击射线
  camera: THREE.PerspectiveCamera,
  axesCamera: THREE.OrthographicCamera,
  composer: any,
  renderPass: any,
  outlinePass: any,
  effectFXAA: any,
  renderer: THREE.WebGLRenderer,
  axesRenderer: THREE.WebGLRenderer,
  enableCatch: boolean = true,
  offset: [number, number],
  width: number,
  height: number;

// 各个方向为近 30 度偏转
const ViewingAngle = [
  new THREE.Vector3(0, 1, 2).normalize(), // 前上
  new THREE.Vector3(0, -1, 2).normalize(), // 前下
  new THREE.Vector3(-2, 0, 1).normalize(), // 前左
  new THREE.Vector3(2, 0, -1).normalize(), // 前右
  new THREE.Vector3(0, 1, -2).normalize(), // 后上
  new THREE.Vector3(0, -1, -2).normalize(), // 后下
  new THREE.Vector3(-2, 0, -1).normalize(), // 后左
  new THREE.Vector3(2, 0, -1).normalize(), // 后右
  new THREE.Vector3(0, 1, 2).normalize(), // 上前
  new THREE.Vector3(0, 1, -2).normalize(), // 上后
  new THREE.Vector3(-2, 1, 0).normalize(), // 上左
  new THREE.Vector3(2, 1, 0).normalize(), // 上右
  new THREE.Vector3(-1, 0, 2).normalize(), // 左前
  new THREE.Vector3(-1, 0, -2).normalize(), // 左后
  new THREE.Vector3(-1, 2, 0).normalize(), // 左上
  new THREE.Vector3(-1, -2, 0).normalize(), // 左下
  new THREE.Vector3(1, 0, 2).normalize(), // 右前
  new THREE.Vector3(1, 0, -2).normalize(), // 右后
  new THREE.Vector3(1, 2, 0).normalize(), // 右上
  new THREE.Vector3(1, -2, 0).normalize(), // 右下
];
const HESAGON = [
  new THREE.Vector3(0, 0, 1),
  new THREE.Vector3(0, 0, -1),
  new THREE.Vector3(0, 1, 0),
  new THREE.Vector3(-1, 0, 0),
  new THREE.Vector3(1, 0, 0),
];
/**
 * 计算物体中心距离其六个表面所穿过的模型数量，返回最小的面对应的点(最佳观看角度)
 * @param center 模型包围盒中心点
 * @param radius 模型包围盒半径
 */

function getBestViewingPosition(
  model: THREE.Group | THREE.Mesh,
  center: THREE.Vector3,
  radius: number,
) {
  let bestPos = new THREE.Vector3();
  let bestDirection = new THREE.Vector3();
  let intersectsCount = 10000;
  const sideCenter = HESAGON.map((agon) =>
    new THREE.Vector3().copy(center).addScaledVector(agon, radius),
  );
  ViewingAngle.forEach((side, index) => {
    const raycaster = new THREE.Raycaster(
      sideCenter[index % 4],
      side,
      0,
      radius * 1.5,
    );
    // const raycaster = new THREE.Raycaster(center, side, 0, radius * 2);
    let intersects = raycaster.intersectObjects(model.children);
    // console.log('o', intersects.length);

    if (intersects.length < intersectsCount) {
      intersectsCount = intersects.length;
      bestDirection.copy(side);
    }
  });

  bestPos.copy(center);
  return bestPos.addScaledVector(bestDirection, radius * 1.5);
}

/**
 * @param position1 相机当前的位置
 * @param target1 当前的controls的target
 * @param position2 相机的目标位置
 * @param target2 新的controls的target
 */
function animateCamera(
  position1: THREE.Vector3,
  target1: THREE.Vector3,
  position2: THREE.Vector3,
  target2: THREE.Vector3,
) {
  const tween = new TWEEN.Tween({
    x1: position1.x, // 相机当前位置x
    y1: position1.y, // 相机当前位置y
    z1: position1.z, // 相机当前位置z
    x2: target1.x, // 控制当前的中心点x
    y2: target1.y, // 控制当前的中心点y
    z2: target1.z, // 控制当前的中心点z
  });
  tween.to(
    {
      x1: position2.x, // 新的相机位置x
      y1: position2.y, // 新的相机位置y
      z1: position2.z, // 新的相机位置z
      x2: target2.x, // 新的控制中心点位置x
      y2: target2.y, // 新的控制中心点位置x
      z2: target2.z, // 新的控制中心点位置x
    },
    1000,
  );
  tween.onUpdate(function (this: any) {
    camera.position.set(this._object.x1, this._object.y1, this._object.z1);
    orbitControl.target.set(this._object.x2, this._object.y2, this._object.z2);
    orbitControl.update();
  });
  tween.easing(TWEEN.Easing.Cubic.InOut);
  tween.start();
}

/**
 * 获取模型 orbitControl 中心点和摄像机中心成像位置
 * @param model 需要计算的模型对象
 */
function getModelCenter(model: THREE.Group | THREE.Mesh) {
  const boxHelper = new THREE.BoxHelper(model);
  // scene.add(boxHelper);
  const radius = boxHelper.geometry.boundingSphere?.radius!;
  const center = boxHelper.geometry.boundingSphere?.center!;
  // console.log('模型包围球中心 center：', center);
  // console.log('模型包围球半径 radius', radius);
  //if scene下的Group有children

  return {
    center,
    radius,
  };
}

interface IWorkbench {
  model: THREE.Group | THREE.Mesh
}


function Workbench(props: IWorkbench) {
  const { model } = props;

  const [selected, setSelect] = useState(null);
  const [outlinePassModel, setOutlinePassModel] = useState(null);
  const [controlMode, setControlMode] = useState('disable');
  const threeDom = useRef<HTMLDivElement>(null);
  const axesDom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initScene();

    // 主场景在移动过过程中无法捕获模型
    renderer.domElement.addEventListener(
      'mousedown',
      debounce(
        () => {
          enableCatch = true;
          renderer.domElement.onmousemove = debounce(
            () => {
              enableCatch = false;
            },
            800,
            { leading: true },
          );
        },
        500,
        { leading: true },
      ),
      true,
    );

    renderer.domElement.addEventListener(
      'mouseup',
      debounce(
        () => {
          renderer.domElement.onmousemove = null;
        },
        500,
        { leading: true },
      ),
      true,
    );

    // 关掉页面，关闭websocket
    // return () => {
    //   try {
    //     cncWebSocket.close();
    //     robotWebSocket.close();
    //   } catch (error) {}
    // };
  }, []);

  useEffect(() => {
    if (
      controlMode === 'disable' ||
      controlMode === 'focus'
    ) {
      transformControl.enabled = false;
      transformControl.showX = false;
      transformControl.showY = false;
      transformControl.showZ = false;
    } else {
      if (transformControl.enabled === false) {
        transformControl.enabled = true;
        transformControl.showX = true;
        transformControl.showY = true;
        transformControl.showZ = true;
      }
      transformControl.setMode(controlMode);
    }

    if (controlMode === 'focus' && !isUndefinedOrNull(selected)) {
      focusSelected();
    }
  }, [controlMode]);

  useEffect(() => {
    // console.log('rerender in Workbench');

    if (model !== null) {
      // console.log('secene in workbench: ', scene);
      // console.log('model---saveModelConfigList', saveModelConfigList);

      // console.log('oldModelId in workbench: ', oldModelId);
      scene.add(model);
      renderer.domElement.addEventListener('mouseup', onModelClick, true); // PC
      renderer.domElement.addEventListener('touchstart', onModelClick, false); // Mobile

      updateCamera();
    }

    return () => {
      renderer.domElement.removeEventListener('mouseup', onModelClick, true); // PC
      renderer.domElement.removeEventListener(
        'touchstart',
        onModelClick,
        false,
      ); // Mobile
    };
  }, [model]);

  // redux 上选中的模型变化时更新
  useEffect(() => {
    // console.log('selected', selected);

    if (isUndefinedOrNull(selected)) {
      cancelModelSelect();
    } else {
      if (selected.isMesh) {
        // 如果选中的是某个物体
        // scene.add(outlinePassModel);
        // outlinePass.selectedObjects = [outlinePassModel];
        outlinePass.selectedObjects = [selected];
      } else {
        outlinePass.selectedObjects = [selected];
      }

      controlMode === 'focus' && focusSelected();

      transformControl.attach(selected);
    }
  }, [selected]);

  const initScene = () => {
    scene = new THREE.Scene();
    window.scene = scene
    scene.background = new THREE.Color(0x333333);

    // scene.add(new THREE.AxesHelper(388));
    scene.add(new THREE.GridHelper(150, 10, 0x000000));

    raycaster = new THREE.Raycaster();

    width = threeDom.current!.clientWidth;
    height = threeDom.current!.clientHeight;
    offset = getClientXY(threeDom.current!, 'leftTop');

    camera = new THREE.PerspectiveCamera(60, width / height, NEAR, FAR);
    camera.position.set(0, 78, 275);
    // camera.position.set(78, 78, 275);
    // camera.up.set(0, 0, 1); // 设置 z 轴朝上
    scene.add(camera);

    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      logarithmicDepthBuffer: true,
    });
    // renderer.autoClear = false;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);

    if (threeDom.current!.children.length != 0) {
      threeDom.current!.removeChild(threeDom.current!.children[0]);
    }
    threeDom.current!.appendChild(renderer.domElement);

    // 设置半球光
    scene.add(new THREE.HemisphereLight(0xffffff, 0.8));

    // 设置默认摄像机跟随灯光
    // spotLight = new THREE.SpotLight(0xffffff, 1);
    // spotLight.position.copy(camera.position);
    // spotLight.angle = Math.PI / 2; // 从聚光灯的位置以弧度表示聚光灯的最大范围
    // spotLight.penumbra = 0.1; // 聚光锥的半影衰减百分比
    // spotLight.decay = 1; // 沿着光照距离的衰减量
    // spotLight.distance = FAR; // 从光源发出光的最大距离
    // scene.add(spotLight);

    // 添加平面光
    RectAreaLightUniformsLib.init();
    const rectLight = new THREE.RectAreaLight(0xffffff, 1, 7000, 3000);
    rectLight.position.set(0, 1850, 0);
    rectLight.rotation.set(-Math.PI / 2, 0, 0);

    scene.add(rectLight);
    const rectLight2 = new THREE.RectAreaLight(0xffffff, 1, 7000, 3000);
    rectLight2.position.set(0, 600, -1850);
    rectLight2.rotation.set(Math.PI / 4, Math.PI, 0);
    scene.add(rectLight2);

    // const rectLightHelper = new RectAreaLightHelper(rectLight);
    // rectLight.add(rectLightHelper);

    // const rectLightHelper2 = new RectAreaLightHelper(rectLight2);
    // rectLight2.add(rectLightHelper2 );

    // 添加多通道渲染
    highlightModel();

    // 设置场景控制器
    orbitControl = new THREE.Scene();
    orbitControl = new OrbitControls(camera, renderer.domElement);
    orbitControl.enableDamping = true;
    orbitControl.minDistance = NEAR;
    orbitControl.maxDistance = FAR;
    orbitControl.enablePan = true;
    orbitControl.maxPolarAngle = Math.PI / 2;

    // 模型调整控制器
    transformControl = new TransformControls(camera, renderer.domElement);
    transformControl.traverse((obj) => {
      // 不被 outlinePass 检测
      obj.isTransformControls = true;
    });
    transformControl.setSize(1.3);
    transformControl.addEventListener('change', () => {
      if (selected !== null && outlinePassModel !== null) {
        switch (controlMode) {
          case 'translate': {
            outlinePassModel.position.copy(
              selected.getWorldPosition(ThreeD.vector3),
            );
            break;
          }
          case 'scale': {
            outlinePassModel.scale.copy(selected.scale);
            break;
          }
          case 'rotate': {
            // console.log('selected', selected.rotation);
            // 由于坐标轴指向问题，直接 copy 会导致模型变形
            outlinePassModel.rotation.copy(selected.rotation);
            outlinePassModel.rotateX(-Math.PI / 2);
            // console.log('outlinePassModel', state.outlinePassModel.rotation);
            break;
          }
          default:
            break;
        }
      }
    });
    transformControl.addEventListener('mouseDown', () => {
      orbitControl.enabled = false;
    });
    transformControl.addEventListener('mouseUp', () => {
      // dispatch({
      //   type: 'scene/refreshAttrBoard',
      // });

      orbitControl.enabled = true;
    });

    scene.add(transformControl);

    initAxesScene();
    ThreeD.scene = scene;
    ThreeD.orbitControl = orbitControl;

    window.addEventListener('resize', onWindowResize);
    window.addEventListener(
      'resize',
      debounce(() => {
        offset = getClientXY(threeDom.current!, 'leftTop') as [number, number];
      }, 800),
    );

    window.addEventListener('mouseup', (e) => {
      // 如果键下的是鼠标右键
      if (e.button == 2 && enableCatch) {
        setSelect(null);
      }
    });

    // 渲染动画
    window.requestAnimationFrame(autoRefresh);
    // setInterval(() => {
    //   TWEEN.update();
    //   renderer.render(scene, camera);
    // }, 100);
  };

  // 坐标轴视图
  const initAxesScene = () => {
    axesScene = new THREE.Scene();

    axesCamera = new THREE.OrthographicCamera(-50, 50, 50, -50, NEAR, FAR);
    axesCamera.position.copy(camera.position);
    axesCamera.up.copy(camera.up);

    axesScene.add(axesCamera);

    axesRenderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    axesRenderer.setPixelRatio(window.devicePixelRatio);
    axesRenderer.setSize(100, 100);
    if (axesDom.current!.children.length != 0) {
      axesDom.current!.removeChild(axesDom.current!.children[0]);
    }
    axesDom.current!.appendChild(axesRenderer.domElement);

    axesControl = new OrbitControls(camera, axesRenderer.domElement);
    axesControl.enableDamping = true; // 阻尼
    axesControl.enablePan = false; // 右键拖拽
    axesControl.enableZoom = false; // 缩放
    axesControl.target.copy(orbitControl.target);

    const origin = new THREE.Vector3(0, 0, 0),
      length = 38,
      headLength = 8,
      headWidth = 5,
      xDir = new THREE.Vector3(1, 0, 0),
      yDir = new THREE.Vector3(0, 1, 0),
      zDir = new THREE.Vector3(0, 0, 1),
      xHex = 0xc80000, // 红
      yHex = 0x009c00, // 黄
      zHex = 0x0000c3; // 蓝
    const xArrowHelper = new THREE.ArrowHelper(
        xDir,
        origin,
        length,
        xHex,
        headLength,
        headWidth,
      ),
      yArrowHelper = new THREE.ArrowHelper(
        yDir,
        origin,
        length,
        yHex,
        headLength,
        headWidth,
      ),
      zArrowHelper = new THREE.ArrowHelper(
        zDir,
        origin,
        length,
        zHex,
        headLength,
        headWidth,
      );
    axesScene.add(xArrowHelper, yArrowHelper, zArrowHelper);

    const xSpriteMaterial = new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(makeTextTexture('X', '#c80000')),
      }),
      ySpriteMaterial = new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(makeTextTexture('Y', '#009c00')),
      }),
      zSpriteMaterial = new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(makeTextTexture('Z', '#0000c3')),
      });
    const xSprite = new THREE.Sprite(xSpriteMaterial),
      ySprite = new THREE.Sprite(ySpriteMaterial),
      zSprite = new THREE.Sprite(zSpriteMaterial);
    xSprite.position.set(38, 15, 3);
    xSprite.scale.set(20, 20, 0);
    ySprite.position.set(15, 38, 3);
    ySprite.scale.set(20, 20, 0);
    zSprite.position.set(-3, 15, 38);
    zSprite.scale.set(20, 20, 0);

    axesScene.add(xSprite, ySprite, zSprite);
  };

  function render() {
    if (composer?.render) {
      composer.render();
    } else {
      renderer.render(scene, camera);
    }
    // 坐标轴跟随移动, 需要减去 orbitControl 的控制中心
    // axesCamera.position.copy(camera.position.add(orbitControl.target.negate())); // Vector3.negate() 会改变自身值
    axesCamera.position.subVectors(camera.position, orbitControl.target);
    axesCamera.position.clampLength(50, 50); // 限制成像大小
    axesCamera.lookAt(0, 0, 0);

    // 默认点光源跟随移动
    // spotLight.position.copy(camera.position);

    axesRenderer.render(axesScene, axesCamera);

    orbitControl.update();
  }

  function autoRefresh() {
    TWEEN.update();
    // 使用通道渲染
    render();

    window.requestAnimationFrame(autoRefresh);
  }

  function focusSelected() {
    const { center, radius } = getModelCenter(selected);
    const bestPos = getBestViewingPosition(model, center, radius);
    // console.log('c', center, 'r', radius, 'b', bestPos);

    animateCamera(camera.position, orbitControl.target, bestPos, center);
    camera.lookAt(center);
  }

  function onWindowResize() {
    width = threeDom.current!.clientWidth;
    height = threeDom.current!.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
    composer.setSize(width, height);

    effectFXAA.uniforms.resolution.value.set(1 / width, 1 / height);
  }

  // 监听 3d 展示区域的点击
  function onModelClick(event: any) {
    if (!enableCatch) {
      return;
    }

    event.preventDefault();

    if (event.touches) {
      // 是否是移动端触摸事件
      mouse.x =
        ((event.touches[0].clientX - offset[0]) /
          threeDom.current!.offsetWidth) *
          2 -
        1;
      mouse.y =
        -(
          (event.touches[0].clientY - offset[1]) /
          threeDom.current!.offsetHeight
        ) *
          2 +
        1;
    } else {
      mouse.x =
        ((event.clientX - offset[0]) / threeDom.current!.offsetWidth) * 2 - 1;
      mouse.y =
        -((event.clientY - offset[1]) / threeDom.current!.offsetHeight) * 2 + 1;
    }

    raycaster.setFromCamera(mouse, camera);
    let intersects = raycaster.intersectObjects(model.children);

    // console.log('intersects', intersects);

    if (intersects.length > 0) {
      setSelect(intersects[0].object);
    }
  }

  function cancelModelSelect() {
    transformControl.detach();
    outlinePass.selectedObjects = [];
  }

  // 设置多通道，当选定模型组成部分时，高亮其边框
  function highlightModel() {
    renderPass = new RenderPass(scene, camera);
    outlinePass = new OutlinePass(
      new THREE.Vector2(width, height),
      scene,
      camera,
    );

    outlinePass.edgeStrength = 2.5; // 边框的亮度
    outlinePass.edgeGlow = 1; // 光晕[0,1]
    outlinePass.usePatternTexture = false; // 是否使用父级的材质
    outlinePass.edgeThickness = 1.0; // 边框宽度
    outlinePass.downSampleRatio = 2; // 边框弯曲度
    outlinePass.pulsePeriod = 0; // 呼吸闪烁的速度
    outlinePass.visibleEdgeColor.set(0x39ffff); // 呼吸显示的颜色
    outlinePass.clear = true;

    // 自定义的着色器通道 作为参数
    effectFXAA = new ShaderPass(FXAAShader);
    effectFXAA.uniforms.resolution.value.set(1 / width, 1 / height);
    // effectFXAA.renderToScreen = true;

    composer = new EffectComposer(renderer);
    composer.addPass(renderPass);
    composer.addPass(outlinePass);
    composer.addPass(effectFXAA);
  }

  // 动态添加模型时，调整相机使其能照到整个模型全景
  function updateCamera() {
    // if (scene.children[scene.children.length - 1].children.length > 0) {//if scene下的Group有children
    if (model !== null && model?.children.length > 0) {
      const { center, radius } = getModelCenter(model);

      camera.lookAt(center);
      camera.position.set(
        model.position.x + center.x + radius * 0.8,
        model.position.y + center.y + radius,
        model.position.z + center.z + radius * 1.2,
      ),
        orbitControl.target.copy(center);
      axesControl.target.copy(center);
    } else {
      camera.position.set(0, 78, 275);
      camera.lookAt(0, 0, 0);
      orbitControl.target.set(0, 0, 0);
      axesControl.target.set(0, 0, 0);
    }

    orbitControl.update();
  }

  return (
    <div className='workbench-wrapper'>
      <div className='tab-bar' style={isUndefinedOrNull(selected) ? {display: 'none'} : {}}>
        <button onClick={() => setControlMode('translate')}>移动</button>
        <button onClick={() => setControlMode('rotate')}>旋转</button>
        <button onClick={() => setControlMode('scale')}>缩放</button>
        <button onClick={() => setControlMode('focus')}>追踪</button>
        <button onClick={() => setControlMode('disable')}>隐藏</button>
      </div>
      {isUndefinedOrNull(props.model) && <div className='tip'>
        <span>上传FBX模型以继续</span>
      </div>}
      <div className='container'>
        <div ref={threeDom} className='main'></div>
        <div ref={axesDom} className='axes'></div>
      </div>
    </div>
  );
}

export default Workbench;
