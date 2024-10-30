import React from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { Navigate } from 'react-router-dom'
import { auth } from './firebase'

function ProtectedRoute({ children }) {
    const [user, loading] = useAuthState(auth);

    if(loading) {
        console.log('Loading user status...');
        return <div>Loading...</div>;
    }
    console.log('User:', user);

    if (!user) {
        return <Navigate to="/auth"/>;
    }

    return children;
}
export default ProtectedRoute;