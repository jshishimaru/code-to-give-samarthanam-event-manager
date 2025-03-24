import { createBrowserRouter } from 'react-router-dom'
import LoginForm from './components/LoginForm';
import SignUpForm from './components/SignUpForm';
import EventPage from './components/EventPage';
import EventDetails from './components/EventDetails';
import FeedbackForm from './components/FeedbackForm';
import MyEvents from './components/host/hostevents/MyEvents';
import CreateEvent from './components/host/hostevents/CreateEvent';
import HostEventDetails from './components/host/hostevents/HostEventDetails';

import Layout from './components/Layout'
import HostLayout from './components/host/hostlayout/HostLayout';

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
        path:'events/:eventId/feedback',
        element: <Layout><FeedbackForm /></Layout>
    },
    {
        path:'/events',
        element: <Layout><EventPage /></Layout>
    },
    {
        path:'/host/MyEvents',
        element: <Layout><MyEvents /></Layout>
    },
    {
        path:'/host/MyEvents/CreateEvent',
        element: <Layout><CreateEvent /></Layout>
    },
    {
        path:'/host/MyEvents/:eventId',
        element: <Layout><HostLayout /></Layout>
    }
]);

export default router;