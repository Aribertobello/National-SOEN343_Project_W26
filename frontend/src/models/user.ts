
export const Role =  {
    OPERATOR: "operator",
    CUSTOMER: "customer",
    ADMIN: "admin"
} as const;

export type Role = (typeof Role)[keyof typeof Role]

export interface User{
    id: number,
    name: string,
    email: string,
    role: Role
}

function isValidUser(data: any): boolean{

    if(typeof data !== "object" || data === null) 
        return false;

    return  "id" in data && "role" in data
}

export function parseUser(data: any): User{
    if(!isValidUser(data))
        throw(new Error(`data cannot be parsed to User: ${data}`))
    return data as User;
}

