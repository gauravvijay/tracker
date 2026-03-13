import { createHashRouter } from "react-router-dom";
import Home from "./Home";

// Use hash-based routing so the app works on GitHub Pages without requiring
// server-side routing support.
export const router = createHashRouter([
  {
    path: "/",
    element: <Home />,
  },
]);
