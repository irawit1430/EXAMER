import { create } from "zustand";
import {
  User,
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getSyllabusTree } from "@/lib/firebase/firestore";
import type { UserProfile, SyllabusTree } from "@/types";

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  syllabusTree: SyllabusTree | null;
  loading: boolean;
  initialized: boolean;
  init: () => void;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  setSyllabusTree: (tree: SyllabusTree) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  syllabusTree: null,
  loading: true,
  initialized: false,

  init: () => {
    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch or create user profile from Firestore
        const docRef = doc(db, "users", firebaseUser.uid);
        const docSnap = await getDoc(docRef);

        let userProfile: UserProfile | null = null;
        if (docSnap.exists()) {
          const data = docSnap.data();
          userProfile = {
            ...data,
            createdAt: data.createdAt?.toDate
              ? data.createdAt.toDate()
              : new Date(data.createdAt || Date.now()),
            examDate: data.examDate?.toDate
              ? data.examDate.toDate()
              : new Date(data.examDate || Date.now()),
            streak: {
              ...data.streak,
              lastActive: data.streak?.lastActive?.toDate
                ? data.streak.lastActive.toDate()
                : new Date(data.streak?.lastActive || Date.now()),
            },
            onboardingComplete: !!data.onboardingComplete,
          } as UserProfile;
        } else {
          // If it doesn't exist, we'll create a basic one (usually handled during signup)
          userProfile = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || "Student",
            email: firebaseUser.email || "",
            examDate: new Date(),
            predictedScore: 0,
            streak: { current: 0, longest: 0, lastActive: new Date() },
            whatsappOptIn: false,
            targetScore: 0,
            createdAt: new Date(),
            onboardingComplete: false,
          };
          // Try saving it (non-blocking)
          setDoc(docRef, userProfile).catch(console.error);
        }

        set({
          user: firebaseUser,
          profile: userProfile,
          loading: false,
          initialized: true,
        });

        // Load syllabus tree in background
        getSyllabusTree(firebaseUser.uid)
          .then((tree) => {
            if (tree) set({ syllabusTree: tree });
          })
          .catch(console.error);
      } else {
        set({ user: null, profile: null, loading: false, initialized: true });
      }
    });

    // We don't return unsubscribe to Zustand directly, but this runs once at app start.
  },

  updateProfile: async (data: Partial<UserProfile>) => {
    const { user, profile } = get();
    if (!user || !profile) return;

    const updatedProfile = { ...profile, ...data };

    try {
      const docRef = doc(db, "users", user.uid);
      await setDoc(docRef, updatedProfile, { merge: true });
      set({ profile: updatedProfile });
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  },

  setSyllabusTree: (tree) => set({ syllabusTree: tree }),

  signOut: async () => {
    await firebaseSignOut(auth);
    set({ user: null, profile: null, syllabusTree: null });
  },
}));
