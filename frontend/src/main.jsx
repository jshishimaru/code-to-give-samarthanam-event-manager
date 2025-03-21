import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import router from './router'
import { RouterProvider } from 'react-router-dom'
import './index.css' 

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Failed to find the root element')
createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)