/**
 * AuthContext - Supabase Auth認証コンテキスト
 * 
 * アプリケーション全体で認証状態を管理します。
 * - Supabase Authのセッション状態を管理
 * - セッション変更をリアルタイムで検知
 * - 認証状態をReactコンポーネントに提供
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

/**
 * AuthContext型定義
 */
interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
}

/**
 * AuthContext作成
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthContextProvider - 認証状態を提供するプロバイダー
 */
export function AuthContextProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        // 初回セッション取得
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // セッション変更をリアルタイムで検知
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [supabase.auth]);

    /**
     * Google OAuthでログイン
     */
    const signInWithGoogle = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });
            if (error) throw error;
        } catch (error) {
            console.error('Authentication error:', error);
            alert('ログインに失敗しました。もう一度お試しください。');
        }
    };

    /**
     * ログアウト
     */
    const signOut = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
        } catch (error) {
            console.error('Sign out error:', error);
            alert('ログアウトに失敗しました。もう一度お試しください。');
        }
    };

    const value = {
        user,
        session,
        loading,
        signInWithGoogle,
        signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth - AuthContextを使用するカスタムフック
 */
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthContextProvider');
    }
    return context;
}
