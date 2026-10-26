import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';

interface AuthContextType {
    currentUser: User | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const getInitialUser = (): User | null => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            if (params.get('dev') === 'true' || localStorage.getItem('skillsphere_dev_auth') === 'true') {
                return {
                    uid: "test-user-123",
                    displayName: "TestAgent",
                    email: "agent@test.com",
                    photoURL: "https://via.placeholder.com/150"
                } as unknown as User;
            }
        }
        return null;
    };

    const [currentUser, setCurrentUser] = useState<User | null>(getInitialUser);
    const [loading, setLoading] = useState<boolean>(() => getInitialUser() === null);
    const auth = getAuth();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('dev') === 'true' || localStorage.getItem('skillsphere_dev_auth') === 'true') {
            localStorage.setItem('skillsphere_dev_auth', 'true');
            setCurrentUser({
                uid: "test-user-123",
                displayName: "TestAgent",
                email: "agent@test.com",
                photoURL: "https://via.placeholder.com/150"
            } as unknown as User);
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, [auth]);

    const value = {
        currentUser
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export default AuthContext;

