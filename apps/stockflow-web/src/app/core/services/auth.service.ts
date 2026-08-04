import { computed, Injectable, OnDestroy, signal } from '@angular/core';
import {
  AuthChangeEvent,
  AuthError,
  createClient,
  Session,
  SupabaseClient,
  User
} from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from '../config/supabase.config';

export interface SignUpDetails {
  email: string;
  password: string;
  fullName: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService implements OnDestroy {
  readonly configured = SUPABASE_CONFIG.configured;

  private readonly sessionState = signal<Session | null>(null);
  private readonly loadingState = signal(true);
  private readonly client?: SupabaseClient;
  private unsubscribe?: () => void;

  readonly session = this.sessionState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly user = computed<User | null>(() => this.sessionState()?.user ?? null);
  readonly accessToken = computed(() => this.sessionState()?.access_token ?? null);
  readonly displayName = computed(() => {
    const user = this.user();
    const metadataName = user?.user_metadata?.['full_name'];
    return typeof metadataName === 'string' && metadataName.trim()
      ? metadataName.trim()
      : user?.email?.split('@')[0] || 'StockFlow User';
  });

  constructor() {
    if (!this.configured) {
      this.loadingState.set(false);
      return;
    }

    this.client = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.publishableKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      }
    });

    const { data } = this.client.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        this.sessionState.set(session);
        this.loadingState.set(false);
      }
    );
    this.unsubscribe = () => data.subscription.unsubscribe();

    void this.client.auth.getSession().then(({ data: sessionData }) => {
      this.sessionState.set(sessionData.session);
      this.loadingState.set(false);
    }).catch(() => this.loadingState.set(false));
  }

  async signIn(email: string, password: string): Promise<string | null> {
    if (!this.client) return 'Supabase is not configured.';
    const { error } = await this.client.auth.signInWithPassword({ email, password });
    return this.authErrorMessage(error);
  }

  async signUp(details: SignUpDetails): Promise<{ error: string | null; confirmationRequired: boolean }> {
    if (!this.client) {
      return { error: 'Supabase is not configured.', confirmationRequired: false };
    }

    const { data, error } = await this.client.auth.signUp({
      email: details.email,
      password: details.password,
      options: {
        data: { full_name: details.fullName },
        emailRedirectTo: window.location.origin
      }
    });

    return {
      error: this.authErrorMessage(error),
      confirmationRequired: !error && !data.session
    };
  }

  async signOut(): Promise<string | null> {
    if (!this.client) return null;
    const { error } = await this.client.auth.signOut();
    return this.authErrorMessage(error);
  }

  ngOnDestroy(): void {
    this.unsubscribe?.();
  }

  private authErrorMessage(error: AuthError | null): string | null {
    if (!error) return null;
    if (error.status === 400) return 'The email or password is incorrect.';
    if (error.status === 422) return 'Check the email address and password requirements.';
    if (error.status === 429) return 'Too many attempts. Wait a moment and try again.';
    return error.message || 'Authentication failed. Please try again.';
  }
}
