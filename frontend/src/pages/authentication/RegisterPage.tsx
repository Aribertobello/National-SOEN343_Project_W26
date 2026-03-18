import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { signup, login } from "@/services/authService";
import { Role } from "@/models/user";

function isValidEmail(email: string): boolean {
  const trimmed = email.trim();

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

const RegisterPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [hint, setHint] = useState<string>("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [opName,setOpName] = useState<string>("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<Role>(Role.CUSTOMER);
    const navigate = useNavigate();

    const handleSignUp = async () => {

        setHint("");

        //TODO validate email syntax ,min lengh for passwords  
        
        const name = (role === Role.CUSTOMER)
        ? `${firstName.trim()} ${lastName.trim()}`.trim()
        : opName.trim();
        
        if (!name || !email || !password) {
            setHint("Please fill in the fields before submitting");
            return;
        }

        if (!isValidEmail(email)) {
            setHint("Please enter a valid email");
            return;
        }


        setIsLoading(true);
        try{
            await signup(name, email, password, role);
        } catch(err: any){
            setHint(err?.message ?? "signup failed for unknown reason, try again later");
            setIsLoading(false);
            return;
        }
        try{
            await login(email, password);
        } catch {
            setHint("account created successfully but failed to log you in, try again later");
            setIsLoading(false);
            return;
        }
        setIsLoading(false);
        navigate("/"); 
    };

    return (
        <Card className="w-full max-w-sm">
            <CardHeader>
                <CardTitle className="text-2xl">Sign Up</CardTitle>
                <CardDescription>
                    Enter your information to create an account
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <div className="grid grid-cols-2 gap-2">
                    <Button
                    type="button"
                    variant={role === Role.CUSTOMER ? "default" : "outline"}
                    onClick={() => setRole(Role.CUSTOMER)}
                    >
                        Client Signup
                    </Button>
                    <Button
                    type="button"
                    variant={role === Role.OPERATOR ? "default" : "outline"}
                    onClick={() => setRole(Role.OPERATOR)}
                    >
                        Operator Register
                    </Button>
                </div>
                {role == Role.CUSTOMER ?
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="first-name">First name</Label>
                        <Input
                            id="first-name"
                            placeholder="Max"
                            required
                            autoComplete="off"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="last-name">Last name</Label>
                        <Input
                            id="last-name"
                            placeholder="Robinson"
                            required
                            autoComplete="off"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)} />
                    </div>
                </div>
                : 
                    <div className="grid gap-2">
                    <Label htmlFor="operator-name">Business / operator name</Label>
                    <Input
                    id="operator-name"
                    placeholder="Societe de Transport de Montreal"
                    autoComplete="organization"
                    value={opName}
                    onChange={(e) => setOpName(e.target.value)}
                    />
                </div>
                }
                
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        required
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)} />
                </div>
                {hint && (
                <div className="flex items-center justify-between text-red-400">
                    {hint}
                </div>
                )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
                <Button className="w-full" onClick={handleSignUp} disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Please wait
                        </>
                    ) : (
                        "Create account"
                    )}
                </Button>
                <div className="text-center text-sm">
                    Already have an account?{" "}
                    <Link to="/login" className="underline">
                        Sign in
                    </Link>
                </div>
            </CardFooter>
        </Card>
    );
};

export default RegisterPage;
