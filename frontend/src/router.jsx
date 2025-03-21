import { createBrowserRouter } from 'react-router-dom'
import LoginForm from './components/LoginForm';
import SignUpForm from './components/SignUpForm';
import EventPage from './components/EventPage';

const router = createBrowserRouter([
	
	{	
		path: '/',
		element: <LoginForm />
	},
	{	
		path: '/login',
		element: <LoginForm />
	},
	{
		path:'/signup',
		element: <SignUpForm />
	},
	{
		path:'events',
		element: <EventPage />
	}

]);

export default router;
