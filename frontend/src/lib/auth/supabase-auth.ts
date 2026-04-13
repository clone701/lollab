/**
 * Supabase認証ユーティリティ
 *
 * Supabase Authを使用した認証機能を提供します。
 */

import { createClient } from '@/lib/supabase/client';

/**
 * Googleでサインイン
 */
export async function signInWithGoogle() {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    console.error('Sign in error:', error);
    throw error;
  }

  return data;
}

/**
 * サインアウト
 */
export async function signOut() {
  const supabase = createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

/**
 * 現在のセッションを取得
 */
export async function getSession() {
  const supabase = createClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error('Get session error:', error);
    throw error;
  }

  return session;
}

/**
 * 現在のユーザーを取得
 */
export async function getUser() {
  const supabase = createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error('Get user error:', error);
    throw error;
  }

  return user;
}
