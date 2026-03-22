import { useEffect, useState, createContext, useContext, ReactNode } from "react";
import Constants from "expo-constants";
import { initSupabase, isSupabaseInitialized } from "@decoded/shared";

type SupabaseContextType = {
  isInitialized: boolean;
};

const SupabaseContext = createContext<SupabaseContextType>({
  isInitialized: false,
});

export function useSupabaseContext() {
  return useContext(SupabaseContext);
}

type Props = {
  children: ReactNode;
};

export function SupabaseProvider({ children }: Props) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Get Supabase credentials from Expo config
    const supabaseUrl =
      Constants.expoConfig?.extra?.supabaseUrl ||
      process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey =
      Constants.expoConfig?.extra?.supabaseAnonKey ||
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error(
        "Missing Supabase credentials. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY."
      );
      return;
    }

    if (!isSupabaseInitialized()) {
      initSupabase(supabaseUrl, supabaseAnonKey);
    }
    setIsInitialized(true);
  }, []);

  return (
    <SupabaseContext.Provider value={{ isInitialized }}>
      {children}
    </SupabaseContext.Provider>
  );
}
