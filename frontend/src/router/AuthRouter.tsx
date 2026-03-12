import AuthLayout from '@/pages/authentication/AuthLayout';
import ForgotPasswordPage from '@/pages/authentication/ForgotPasswordPage';
import LoginPage from '@/pages/authentication/LoginPage';
import RegisterPage from '@/pages/authentication/RegisterPage';
import type { RouteObject } from 'react-router-dom';

const authRouter: RouteObject = {
  element: <AuthLayout />,
  children: [
    {
      path: 'login',
      element: <LoginPage />,
    },
    {
      path: 'register',
      element: <RegisterPage />,
    },
    {
      path: 'forgot-password',
      element: <ForgotPasswordPage />,
    },
  ],
};

export default authRouter;
