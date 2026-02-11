import {Link}  from "react-router-dom";

export default function NotFound(){
    return (
        <div className="flex flex-col py-40 gap-y-20 items-center">
            <h1 className="text-5xl">ERROR 404</h1>
            <h1>PAGE NOT FOUND</h1>
            <Link to={"/"}><button></button></Link>
        </div>
    );
}