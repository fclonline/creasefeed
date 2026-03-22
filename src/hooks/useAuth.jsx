import { useState, useEffect, createContext, useContext } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, provider } from '../firebase/config'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null)
  const [pro, setPro]           = useState(false)
  const [isNewUser, setIsNewUser] = useState(false)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        const ref  = doc(db, 'users', firebaseUser.uid)
        const snap = await getDoc(ref)
        if (!snap.exists()) {
          await setDoc(ref, {
            email:         firebaseUser.email,
            name:          firebaseUser.displayName,
            photoURL:      firebaseUser.photoURL,
            pro:           false,
            onboardingDone:false,
            followedTeams: {},
            createdAt:     serverTimestamp(),
          })
          setPro(false)
          setIsNewUser(true)   // trigger onboarding
        } else {
          const data = snap.data()
          setPro(data.pro === true)
          setIsNewUser(data.onboardingDone === false)
        }
      } else {
        setUser(null)
        setPro(false)
        setIsNewUser(false)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const signIn  = () => signInWithPopup(auth, provider)
  const signOut = () => firebaseSignOut(auth)

  return (
    <AuthContext.Provider value={{ user, pro, isNewUser, setIsNewUser, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
