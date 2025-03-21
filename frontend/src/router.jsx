import { createBrowserRouter } from 'react-router-dom'
import LoginForm from './components/LoginForm';

const router = createBrowserRouter([
	
	{	
		path: '/',
		element: <LoginForm />
	},
	{
		path:'/signup',
		// element: <SignUpForm />
	}

]);

export default router;
