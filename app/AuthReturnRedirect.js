'use client';

import { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Recovery for OAuth providers that return to the configured Site URL instead
// of the requested callback URL. This only acts when the admin login set a
// one-tab destination marker before leaving the site.
export default function AuthReturnRedirect() {
  useEffect(() => {
    const storageKey = 'maratonei_auth_next';
    const requestedPath = window.sessionStorage.getItem(storageKey);
    if (!requestedPath) return;

    const destination = requestedPath === '/admin/comunicados' ? requestedPath : '/inicio';
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return;

    const supabase = createClient(supabaseUrl, supabaseKey);
    let redirected = false;

    const finishLogin = (session) => {
      if (!session || redirected) return;
      redirected = true;
      window.sessionStorage.removeItem(storageKey);
      window.location.replace(destination);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      finishLogin(session);
    });

    supabase.auth.getSession().then(({ data, error }) => {
      if (!error) finishLogin(data?.session);
    }).catch(() => {});

    return () => subscription.unsubscribe();
  }, []);

  return null;
}
