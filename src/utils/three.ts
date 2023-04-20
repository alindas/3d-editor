// 将 THREE.Group 结构转换成 Hash 结构，取 id 值作为 key
export function TransformArrayToHash(array) {
  const target = {};

  const loopSet = (_array) => {
    _array?.forEach((item) => {
      target[item.id] = item;
      if (item.children.length != 0) {
        loopSet(item.children);
      }
    });
  };

  loopSet(array);

  return target;
}

// 创建文本贴图
export function makeTextTexture(text, color) {
  let canvas = document.createElement('canvas');
  canvas.width = 24;
  canvas.height = 24;
  let context = canvas.getContext('2d');
  context.font = '900 18px serif';
  context.fillStyle = color;
  context.fillText(text, 0, 24);

  return canvas;
}

// 找出某个树支点对应的整条树分支线 id 并更新原数组
export function updateModelFromName(array, keyArray, newValue) {
  const idList = [];

  const loopSet = (_array, keyArray, newValue, idArray, leval) => {
    for (let i = 0; i < _array.length; i++) {
      if (i == keyArray[leval]) {
        idArray.push(_array[i].id);

        if (leval !== keyArray.length - 1) {
          leval++;
          loopSet(_array[i].children, keyArray, newValue, idArray, leval);
        } else {
          _array[i].title = newValue;
        }

        break;
      }
    }
  };

  loopSet(array, keyArray, newValue, idList, 1);

  return [array, idList];
}

// 判断材质属性是否被修改过，没被修改过则返回一个全新的材质对象
export function checkMaterialModifyTime(material) {
  if (!material.userData.haveModify) {
    const newMaterial = material.clone();
    newMaterial.userData.haveModify = true;
    return newMaterial;
  }
  return true;
}

// 删除模型时回收其材质和几何体内存
export function freeModelMemory(model) {
  if (typeof model === 'undefined' || model === null) return;
  model.traverse((child) => {
    if (child.isMesh) {
      child.geometry.dispose(); // 删除几何体
      if (child.material.dispose instanceof Function) {
        child.material.dispose(); // 删除材质
      }
    }
  });
}

// 如果当前选择的模型控件存在父子关系的父控件，则改为选择其父控件
export function loopUpBind(model) {
  if (model && model.parent) {
    if (model.parent?.isGroup) {
      return model;
    } else {
      return loopUpBind(model.parent);
    }
  } else {
    return undefined;
  }
}
