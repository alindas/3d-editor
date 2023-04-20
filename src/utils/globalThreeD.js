/**
 * 通过一个全局 3D 对象沟通不同组件间的通信
 */

import { Vector3, Quaternion } from 'three';

export default class ThreeD {}

ThreeD.scene = null;
ThreeD.orbitControl = null;
ThreeD.vector3 = new Vector3(); // 世界坐标和本地转换时经常需要使用有个变量储存转换的结果
ThreeD.quaternion = new Quaternion();
