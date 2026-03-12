import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
    return (
        <div>
            Layout
            <Outlet />
        </div>
    );
};

export default AuthLayout;
