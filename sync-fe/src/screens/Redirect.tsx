import { Navigate } from 'react-router-dom';

export default () => {
  return <Navigate to={'/sign-in'} replace />;
};