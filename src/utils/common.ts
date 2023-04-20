
function isUndefinedOrNull(obj: any) {
  return typeof obj == 'undefined' || obj === null;
}

/**
 * @describe 递归获取元素距离客户端四边的距离
 * @param ele 目标元素
 * @param direction 方位
 * @returns 对应的距离客户端边距
 */
type Direction = 'top' | 'bottom' | 'left' | 'right' | 'leftTop' | 'leftBottom' | 'rightTop' | 'rightBottom'

 const getClientXY = (ele: HTMLElement, direction: Direction): [number, number] =>  {
  let value1 = 0;
  let value2 = 0;
  let parent: any = ele.offsetParent;
  const targetValue: [number, number] = [value1, value2];
  switch (direction) {
    case 'top': {
      value1 = ele.offsetTop;
      while (parent!= null) {
        value1 += parent.offsetTop;
        parent = parent.offsetParent;
      }
      break;
    }

    case 'bottom': {
      value1 = ele.offsetTop;
      let top_offsetHeight = 0;
      while (parent!= null) {
        value1 += parent.offsetTop;
        parent = parent.offsetParent;
        parent &&  (top_offsetHeight = parent.offsetHeight);
      }
      value1 = top_offsetHeight - value1 - ele.offsetHeight;
      break;
    }

    case 'left': {
      value1 = ele.offsetLeft;
      while (parent!= null) {
        value1 += parent.offsetLeft;
        parent = parent.offsetParent;
      }
      break;
    }

    case 'right': {
      value1 = ele.offsetLeft;
      let top_offsetWidth = 0;
      while (parent!= null) {
        value1 += parent.offsetLeft;
        parent = parent.offsetParent;
        parent &&  (top_offsetWidth = parent.offsetWidth);
      }
      value1 = top_offsetWidth - value1 - ele.offsetWidth;
      break;
    }

    case 'leftTop': {
      value1 = ele.offsetLeft;
      value2 = ele.offsetTop;
      while (parent!= null) {
        value1 += parent.offsetLeft;
        value2 += parent.offsetTop;
        parent = parent.offsetParent;
      }
      break;
    }

    case 'leftBottom': {
      value1 = ele.offsetLeft;
      value2 = ele.offsetTop;
      let top_offsetHeight = 0;
      while (parent!= null) {
        value1 += parent.offsetLeft;
        value2 += parent.offsetTop;
        parent = parent.offsetParent;
        parent && (top_offsetHeight = parent.offsetHeight);
      }
      value2 = top_offsetHeight - value2 - ele.offsetHeight;
      break;
    }

    case 'rightTop': {
      value1 = ele.offsetLeft;
      value2 = ele.offsetTop;
      let top_offsetWidth = 0;
      while (parent!= null) {
        value1 += parent.offsetLeft;
        value2 += parent.offsetTop;
        parent = parent.offsetParent;
        parent &&  (top_offsetWidth = parent.offsetWidth);
      }
      value1 = top_offsetWidth - value1 - ele.offsetWidth;
      break;
    }

    case 'rightBottom': {
      value1 = ele.offsetLeft;
      value2 = ele.offsetTop;
      let top_offsetWidth = 0;
      let top_offsetHeight = 0;
      while (parent!= null) {
        value1 += parent.offsetLeft;
        value2 += parent.offsetTop;
        parent = parent.offsetParent;
        if (parent) {
          top_offsetWidth = parent.offsetWidth;
          top_offsetHeight = parent.offsetHeight
        }
      }
      value1 = top_offsetWidth - value1 - ele.offsetWidth;
      value2 = top_offsetHeight - value2 - ele.offsetHeight;
      break;
    }

    default: break;

  }

  return targetValue;
}

export {
  isUndefinedOrNull,
  getClientXY,
}
