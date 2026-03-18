import { ApiClient } from "@/utils/ApiClient";
import { authState } from "@/auth/authState";
import { parseUser, Role } from "@/models/user";

async function login(email: string, password: string){

    await ApiClient.getInstance().post(
        `/api/auth/login`, 
        {username:email, password:password});

    const userData = await ApiClient.getInstance().get(`/api/auth/user`);
    try{
        console.log(userData)
        const user = parseUser(userData);
        authState.setUser(user);
    } catch (err: any){
        throw( new Error("Unexpected response from server try again later"))
    }
}

async function logout(){

    await ApiClient.getInstance().post(
        `/api/auth/logout/`,{});
    authState.removeUser();
}

async function signup(name: string, email:string,  password: string, role: Role){
    await ApiClient.getInstance().post(
        `/api/auth/signup/`, 
        {name:name, email:email, password:password, role:role});
    await login(email, password);
}

async function initAuth() {
  try {
    const data = await ApiClient.getInstance().get("/api/auth/user");
    authState.setUser(parseUser(data));
  } catch {
    authState.setUser(null);
  } finally {
    authState.setLoading(false);
  }
}


export {initAuth, login, logout, signup}