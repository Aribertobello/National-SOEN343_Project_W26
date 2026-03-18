import {Link}  from "react-router-dom";
import { Button } from "@/components/ui/button";
import { logout } from "@/services/authService";
import { useNavigate } from "react-router-dom";

export default function NotFound({description}: {description: string}){
    const navigate = useNavigate();
    return (
        <div className="flex flex-col py-40 gap-y-20 items-center">
            <h1 className="text-5xl">ERROR 403</h1>
            <h1>{description}</h1>
            <div className="flex justify-between min-w-75">
                <Button onClick={()=>{navigate("/login")}} className="bg-[#3B82F6] border p-4 rounded-2xl hover:bg-[#2563EB] text-white">
                        Login
                </Button>
                <Link to={"/"} className="bg-[#EC4899] border p-4 rounded-2xl hover:bg-[#de3389] text-white">
                    Go Back
                </Link>
                    <Button onClick={()=>{logout(); navigate("/")}} 
                    className="bg-[#3B82F6] border p-4 rounded-2xl hover:bg-[#2563EB] text-white">
                        Logout
                    </Button>
            </div>
        </div>
    );
}