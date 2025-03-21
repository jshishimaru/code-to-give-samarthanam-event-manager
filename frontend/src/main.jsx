import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import router from './router'
import { RouterProvider } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/Layout'
import './styles/root.css'
import './index.css' 

const savedTheme = localStorage.getItem('preferred-theme');
const savedFontSize = localStorage.getItem('preferred-font-size');
const savedFontWeight = localStorage.getItem('preferred-font-weight');
const savedTextContrast = localStorage.getItem('preferred-text-contrast');


if (savedTheme) {
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  // Apply appropriate contrast mode for assistive technologies
  if (savedTheme === 'high-contrast-light' || savedTheme === 'high-contrast-dark') {
    document.documentElement.style.setProperty('forced-colors', 'active');
  }
} else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  document.documentElement.setAttribute('data-theme', 'dark');
}


// Apply saved font size
if (savedFontSize) {
  document.documentElement.setAttribute('data-font-size', savedFontSize);
}

// Apply saved font weight
if (savedFontWeight) {
  document.documentElement.setAttribute('data-font-weight', savedFontWeight);
}

// Apply saved text contrast
if (savedTextContrast) {
  document.documentElement.setAttribute('data-text-contrast', savedTextContrast);
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