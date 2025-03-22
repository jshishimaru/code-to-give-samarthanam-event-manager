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
      <main id="main-content" style={{ marginTop: '10px' }}>
        {children || <div>No content to display</div>}
      </main>
      <AccessibilityButton />
    </>
  );
};

export default Layout;