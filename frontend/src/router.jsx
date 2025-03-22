import { createBrowserRouter } from 'react-router-dom'
import LoginForm from './components/LoginForm';
import SignUpForm from './components/SignUpForm';
import EventPage from './components/EventPage';
import EventDetails from './components/EventDetails';

import Layout from './components/Layout'
const router = createBrowserRouter([
	
	{	
		path: '/',
		element: <Layout><LoginForm /></Layout>
	},
	{	
		path: '/login',
		element: <Layout><LoginForm /></Layout>
	},
	{
		path:'/signup',
		element: <Layout><SignUpForm /></Layout>
	},
	
	{
		path:'events/:eventId',
		element: <Layout><EventDetails /></Layout>
	},
	{
		path:'/events',
		element: <Layout><EventPage /></Layout>
	}

]);

export default router;
