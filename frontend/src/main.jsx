import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import router from './router'
import { RouterProvider } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/Layout'
import './styles/root.css'
import './index.css' 


// Apply theme from localStorage at app startup
const savedTheme = localStorage.getItem('preferred-theme');
if (savedTheme) {
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  // Apply appropriate contrast mode for assistive technologies
  if (savedTheme === 'high-contrast-light' || savedTheme === 'high-contrast-dark') {
    document.documentElement.style.setProperty('forced-colors', 'active');
  }
} else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  document.documentElement.setAttribute('data-theme', 'dark');
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Failed to find the root element')
createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider>
      <Layout>
        <RouterProvider router={router} />
      </Layout>
    </ThemeProvider>
  </StrictMode>
)