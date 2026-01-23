import { useAuth0 } from "@auth0/auth0-react";
import { UserPlusIcon } from "@heroicons/react/16/solid";
import React from "react";

interface LoginButtonProps {
    children?: React.ReactNode;
    className?: string;
}

const LoginButton = ({children, className} : LoginButtonProps) => {
    const { loginWithRedirect } = useAuth0();
    return (
    <button
        onClick={() => loginWithRedirect()}
        id={'login-link'}
        className={className || "text-white no-underline px-2.5 py-1.5 bg-white/10 rounded-md hover:bg-white/20"}
    >
        <UserPlusIcon  className="size-5 pt-1"/>
        {children}
    </button>
    );
};

export default LoginButton;