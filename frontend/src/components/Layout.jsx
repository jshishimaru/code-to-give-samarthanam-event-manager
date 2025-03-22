import React, { useEffect } from 'react';
import Navbar from './Navbar';
import AccessibilityButton from './AccessibilityButton';

const Layout = ({ children }) => {
  // useEffect(() => {
  //   console.log("Layout rendered");
  // }, []);

  return (
    <>
      <Navbar />
      <main 
        id="main-content" 
        tabIndex="-1"
        style={{ 
          marginTop: '10px',
          outline: 'none' // Remove focus outline
        }}
      >
        {children || <div>No content to display</div>}
      </main>
      <AccessibilityButton />
    </>
  );
};

export default Layout;