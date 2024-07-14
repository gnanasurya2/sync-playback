import {
  createBrowserRouter,
  Route,
  RouterProvider,
  Routes,
  useNavigate,
} from 'react-router-dom';
import Redirect from './screens/Redirect';
import Room from './screens/Room';
import SignIn from './screens/SignIn';
import PrivateRoute from './components/custom/PrivateRoute';
import ToastEvent from './screens/ToastEvent';

export default () => {
  const router = createBrowserRouter([
    {
      path: '/sign-in',
      element: <SignIn />,
    },
    {
      path: '/room/:roomId',
      element: (
        <PrivateRoute>
          <Room />
        </PrivateRoute>
      ),
    },
    {
      path: '/',
      element: <Redirect />,
    },
  ]);
  return (
    <>
      <RouterProvider router={router} />
      <ToastEvent />
    </>
  );
};
