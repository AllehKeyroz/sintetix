"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { auth, db } from "@/lib/firebase"
import { onAuthStateChanged, User } from "firebase/auth"
import { doc, getDoc, onSnapshot } from "firebase/firestore"

interface UserProfile {
    uid: string
    email: string | null
    role?: "admin" | "user"
    [key: string]: any
}

interface AuthContextType {
    user: User | null
    profile: UserProfile | null
    loading: boolean
}

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, loading: true })

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user)

            if (user) {
                // Listen to user profile changes
                const userDocRef = doc(db, "users", user.uid)
                const unsubProfile = onSnapshot(userDocRef, (snap) => {
                    if (snap.exists()) {
                        setProfile({ uid: user.uid, email: user.email, ...snap.data() } as UserProfile)
                    } else {
                        // Default profile if not exists (fallback for compatibility)
                        setProfile({
                            uid: user.uid,
                            email: user.email,
                            role: "user",
                            agencyId: user.uid
                        })
                    }
                    setLoading(false)
                })
                return () => unsubProfile()
            } else {
                setProfile(null)
                setLoading(false)
            }
        })
        return () => unsubscribe()
    }, [])

    return (
        <AuthContext.Provider value={{ user, profile, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
