import {Link}  from "react-router-dom";

export default function NotFound(){
    return (
        <div>
            <h1>ERROR 404</h1>
            <h1>PAGE NOT FOUND</h1>
            <Link to={"/"}><button></button></Link>
        </div>
    );
}