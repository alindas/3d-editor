// 根据文件名判断文件类型  根据文件名后缀返回文件类型
const getFileType = (oneName: any) => {
  const tdType = ['FBX', 'GLTF'];
  const configType = ['JSON'];

  const oneNameArr = oneName.split('.');
  const oneNameType = oneNameArr[oneNameArr.length - 1].toUpperCase();

  let oneType = '';

  if (!oneNameType) {
    oneType = 'noType';
  } else {
    const istdType = tdType.some((item) => {
      return item == oneNameType;
    });
    const isconfigType = configType.some((item) => {
      return item == oneNameType;
    });
    if (istdType) {
      oneType = 'tdType';
    } else if (isconfigType) {
      oneType = 'configType';
    } else {
      oneType = 'otherType';
    }
  }
  return oneType;
};

export default getFileType;
