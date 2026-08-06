import { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, useLocation, useNavigate } from "react-router-dom";
import App from "./App";
import { setCurrentPath, setNavigate } from "./lib/navigation";
import "./index.css";

/** 内部组件：获取 router 的 navigate / location 并注入到 navigation 工具模块 */
function NavigationInit() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setNavigate(navigate);
  }, [navigate]);

  useEffect(() => {
    setCurrentPath(location.pathname);
  }, [location.pathname]);

  return null;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <NavigationInit />
    <App />
  </BrowserRouter>,
);
