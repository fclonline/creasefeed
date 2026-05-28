import { useState, useEffect, useRef, createContext, useContext } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { auth, db, provider } from '../firebase/config'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null)
  const [pro, setPro]           = useState(false)
  const [isNewUser, setIsNewUser] = useState(false)
  const [loading, setLoading]   = useState(true)
  const unsubSnap = useRef(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      // Clean up previous Firestore listener
      if (unsubSnap.current) {
        unsubSnap.current()
        unsubSnap.current = null
      }

      if (firebaseUser) {
        setUser(firebaseUser)
        const ref  = doc(db, 'users', firebaseUser.uid)
        const snap = await getDoc(ref)
        if (!snap.exists()) {
          await setDoc(ref, {
            email:         firebaseUser.email,
            name:          firebaseUser.displayName,
            photoURL:      firebaseUser.photoURL,
            onboardingDone:false,
            followedTeams: {},
            createdAt:     serverTimestamp(),
          })
          setPro(false)
          setIsNewUser(true)
        } else {
          const data = snap.data()
          setPro(data.pro === true)
          setIsNewUser(data.onboardingDone === false)
        }

        // Listen for real-time changes to user doc (pro status updates from Stripe webhook)
        unsubSnap.current = onSnapshot(ref, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data()
            setPro(data.pro === true)
          }
        })
      } else {
        setUser(null)
        setPro(false)
        setIsNewUser(false)
      }
      setLoading(false)
    })
    return () => {
      unsub()
      if (unsubSnap.current) unsubSnap.current()
    }
  }, [])

  // Google popup sign-in
  const signIn  = () => signInWithPopup(auth, provider)

  // Email/password — free profile creation + sign-in.
  // The onAuthStateChanged handler above creates the free Firestore profile
  // (pro: false) for any new user, so both methods land in the same place.
  const signUpEmail = async (email, password, name) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)
    if (name && name.trim()) {
      await updateProfile(cred.user, { displayName: name.trim() })
    }
    return cred
  }
  const signInEmail = (email, password) => signInWithEmailAndPassword(auth, email.trim(), password)

  const signOut = () => firebaseSignOut(auth)

  return (
    <AuthContext.Provider value={{ user, pro, isNewUser, setIsNewUser, loading, signIn, signUpEmail, signInEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
