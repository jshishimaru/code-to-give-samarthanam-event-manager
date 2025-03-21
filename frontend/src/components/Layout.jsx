import AccessibilityButton from './AccessibilityButton';

const Layout = ({ children }) => {
  return (
    <>
      {children}
      <AccessibilityButton />
    </>
  );
};

export default Layout;