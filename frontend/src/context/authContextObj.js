import { createContext } from "react";

// Isolated so fast-refresh can update AuthContext.jsx (a component file)
// without invalidating the context object reference.
export const AuthContext = createContext(null);
