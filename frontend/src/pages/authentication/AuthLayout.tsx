import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <Outlet />
        </div>
    );
};

export default AuthLayout;
