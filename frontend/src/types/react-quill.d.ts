// react-quill v2 的类组件类型与 React 18 不兼容，用宽松声明覆盖
declare module "react-quill" {
  import React from "react";

  const ReactQuill: React.ForwardRefExoticComponent<
    { [key: string]: any } & React.RefAttributes<any>
  >;

  export default ReactQuill;
}
