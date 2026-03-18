/**
 * OBSERVER PATTERN
 * SINGLETON PATTERN
 */



import type { User } from "@/models/user";

interface AuthObserver{
    update(): void
}

class AuthState {
    private static instance: AuthState;
    private user: User | null = null;
    private loading = true;
    private observers: AuthObserver[] = [];

    static getInstance() {
        if (!AuthState.instance) AuthState.instance = new AuthState();
        return AuthState.instance;
    }

    public getUser() { return this.user; }
    public  isLoading() { return this.loading; }

    public addObserver(observer: AuthObserver): void{
        this.observers.push(observer);
    }

    public removeObserver(observer: AuthObserver): void{
        const index = this.observers.indexOf(observer);
        if (index > -1) { 
            this.observers.splice(index, 1); 
        }

    }

    private notifyall(): void{
        this.observers.forEach(
        (observer)=>{observer.update()});
    }

    setUser(user: User | null) {
        this.user = user;
        this.notifyall()
    }

    setLoading(loading: boolean) {
        this.loading = loading;
        this.notifyall()
    }

    public removeUser(){
        this.user = null;
        this.notifyall();
    }
}

export const authState = AuthState.getInstance();