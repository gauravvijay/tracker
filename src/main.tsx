import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "./index.css";
import { StoreProvider } from "./store";
import { router } from "./router";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StoreProvider>
    <RouterProvider router={router} />
  </StoreProvider>,
);
