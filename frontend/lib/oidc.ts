/**
 * OIDC Authentication Service
 * Handles OIDC login flow and token management
 */

// OIDC Configuration
const OIDC_CONFIG = {
  issuer: "https://mavericks-playground.gw.test.onewelcome.net/oauth",
  clientId: "348C95000A1FAD810C2640F8F79462539362DDDA744F4896EA840FD7FFE55C86",
  redirectUri: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '',
  scopes: ["openid", "profile"],
  responseType: "code",
  codeChallengeMethod: "S256"
};

export interface UserInfo {
  sub: string;
  name?: string;
  email?: string;
  preferred_username?: string;
  login_user_name?: string;
  given_name?: string;
  family_name?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserInfo | null;
  token: string | null;
  refreshToken: string | null;
}

class OIDCAuthService {
  private token: string | null = null;
  private refreshToken: string | null = null;
  private idToken: string | null = null;
  private user: UserInfo | null = null;
  private listeners: ((state: AuthState) => void)[] = [];

  constructor() {
    // Initialize from localStorage on client side
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('oidc_token');
      this.refreshToken = localStorage.getItem('oidc_refresh_token');
      this.idToken = localStorage.getItem('oidc_id_token');
      this.user = this.getStoredUser();
    }
  }

  private getStoredUser(): UserInfo | null {
    if (typeof window === 'undefined') return null;
    
    const stored = localStorage.getItem('oidc_user');
    return stored ? JSON.parse(stored) : null;
  }

  private setStoredUser(user: UserInfo | null): void {
    if (typeof window === 'undefined') return;
    
    if (user) {
      localStorage.setItem('oidc_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('oidc_user');
    }
  }

  private setStoredToken(token: string | null, refreshToken?: string | null, idToken?: string | null): void {
    if (typeof window === 'undefined') return;
    
    if (token) {
      localStorage.setItem('oidc_token', token);
    } else {
      localStorage.removeItem('oidc_token');
    }
    
    if (refreshToken) {
      localStorage.setItem('oidc_refresh_token', refreshToken);
    } else {
      localStorage.removeItem('oidc_refresh_token');
    }
    
    if (idToken) {
      localStorage.setItem('oidc_id_token', idToken);
    } else {
      localStorage.removeItem('oidc_id_token');
    }
  }

  private notifyListeners(): void {
    const state: AuthState = {
      isAuthenticated: this.isAuthenticated(),
      user: this.user,
      token: this.token,
      refreshToken: this.refreshToken
    };
    
    this.listeners.forEach(listener => listener(state));
  }

  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  isAuthenticated(): boolean {
    return !!(this.token && this.user);
  }

  getToken(): string | null {
    return this.token;
  }

  getUser(): UserInfo | null {
    return this.user;
  }

  async login(): Promise<void> {
    // Generate PKCE parameters
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);
    const state = this.generateState();

    // Store PKCE parameters for callback
    sessionStorage.setItem('oidc_code_verifier', codeVerifier);
    sessionStorage.setItem('oidc_state', state);

    const authUrl = new URL(`${OIDC_CONFIG.issuer}/v1/authorize`);
    authUrl.searchParams.set('client_id', OIDC_CONFIG.clientId);
    authUrl.searchParams.set('redirect_uri', OIDC_CONFIG.redirectUri);
    authUrl.searchParams.set('response_type', OIDC_CONFIG.responseType);
    authUrl.searchParams.set('scope', OIDC_CONFIG.scopes.join(' '));
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', OIDC_CONFIG.codeChallengeMethod);
    authUrl.searchParams.set('acr_values', 'urn:onewelcome:ujo:v1:auth:journey:id:f2664695-9709-452a-a5bc-0bd79248a6f1');

    window.location.href = authUrl.toString();
  }

  async handleCallback(code: string, state: string): Promise<void> {
    try {
      // Verify state parameter
      const storedState = sessionStorage.getItem('oidc_state');
      if (state !== storedState) {
        throw new Error('Invalid state parameter');
      }

      // Get code verifier
      const codeVerifier = sessionStorage.getItem('oidc_code_verifier');
      if (!codeVerifier) {
        throw new Error('Code verifier not found');
      }

      // Exchange code for token with PKCE
      console.log('Exchanging code for token...', {
        issuer: OIDC_CONFIG.issuer,
        clientId: OIDC_CONFIG.clientId,
        redirectUri: OIDC_CONFIG.redirectUri,
        code: code.substring(0, 10) + '...', // Log partial code for debugging
        codeVerifier: codeVerifier ? 'present' : 'missing',
        fullCodeVerifier: codeVerifier // Log full verifier for debugging
      });

      const tokenResponse = await fetch(`${OIDC_CONFIG.issuer}/v1/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: OIDC_CONFIG.clientId,
          redirect_uri: OIDC_CONFIG.redirectUri,
          code: code,
          code_verifier: codeVerifier,
        }),
      });

      console.log('Token response status:', tokenResponse.status);
      console.log('Token response headers:', Object.fromEntries(tokenResponse.headers.entries()));

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Token exchange failed:', errorText);
        throw new Error(`Token exchange failed: ${tokenResponse.status} - ${errorText}`);
      }

      // Clean up PKCE parameters immediately after successful use
      sessionStorage.removeItem('oidc_code_verifier');
      sessionStorage.removeItem('oidc_state');

      const tokenData = await tokenResponse.json();
      
      // Debug: Log all tokens received
      console.warn('🔍 TOKEN RESPONSE DEBUG:');
      console.warn('  - Available keys:', Object.keys(tokenData));
      console.warn('  - Has access_token:', !!tokenData.access_token);
      console.warn('  - Has refresh_token:', !!tokenData.refresh_token);
      console.warn('  - Has id_token:', !!tokenData.id_token);
      console.warn('  - Full token data:', tokenData);
      
      this.token = tokenData.access_token;
      this.refreshToken = tokenData.refresh_token;
      
      // Store ID token if present (needed for logout)
      if (tokenData.id_token) {
        this.idToken = tokenData.id_token;
        console.warn('✅ ID token received and stored');
      } else {
        console.warn('❌ No ID token in response - using access token as fallback for logout');
      }
      
      // Store all tokens in localStorage
      this.setStoredToken(this.token, this.refreshToken, this.idToken);

      // Get user info
      console.log('Getting user info...');
      const userResponse = await fetch(`${OIDC_CONFIG.issuer}/v1/userinfo`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      console.log('Userinfo response status:', userResponse.status);

      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        console.error('Userinfo request failed:', errorText);
        throw new Error(`Failed to get user info: ${userResponse.status} - ${errorText}`);
      }

      this.user = await userResponse.json();
      console.log('User info received:', this.user);

      // Store in localStorage
      this.setStoredToken(this.token, this.refreshToken);
      this.setStoredUser(this.user);

      // Notify listeners
      this.notifyListeners();

    } catch (error) {
      console.error('OIDC callback error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    // First, construct the logout URL while we still have the tokens
    const logoutUrl = new URL(`${OIDC_CONFIG.issuer}/v1/logout`);
    logoutUrl.searchParams.set('post_logout_redirect_uri', window.location.origin);
    
    // Add id_token_hint if we have an ID token
    console.warn('🔍 LOGOUT TOKEN CHECK:');
    console.warn('  - ID token available:', !!this.idToken);
    console.warn('  - Access token available:', !!this.token);
    console.warn('  - ID token from localStorage:', !!localStorage.getItem('oidc_id_token'));
    console.warn('  - Access token from localStorage:', !!localStorage.getItem('oidc_token'));
    console.warn('  - Current this.idToken value:', this.idToken);
    console.warn('  - Current this.token value:', this.token ? 'Present' : 'Missing');
    
    if (this.idToken) {
      logoutUrl.searchParams.set('id_token_hint', this.idToken);
      console.warn('✅ Using ID token as id_token_hint');
    } else if (this.token) {
      // Fallback to access token if no ID token available
      logoutUrl.searchParams.set('id_token_hint', this.token);
      console.warn('⚠️ Using access token as id_token_hint (fallback)');
    }

    // Now clear the tokens and user info
    this.token = null;
    this.refreshToken = null;
    this.idToken = null;
    this.user = null;
    
    this.setStoredToken(null, null, null);
    this.setStoredUser(null);

    this.notifyListeners();
    
    // Use console.warn for better visibility and persistence
    console.warn('🚪 LOGOUT URL DETAILS (will redirect in 3 seconds):');
    console.warn('  - Issuer:', OIDC_CONFIG.issuer);
    console.warn('  - Logout endpoint:', `${OIDC_CONFIG.issuer}/v1/logout`);
    console.warn('  - Post logout redirect URI:', window.location.origin);
    console.warn('  - ID token hint:', this.idToken ? 'ID Token Present' : (this.token ? 'Access Token (fallback)' : 'Missing'));
    console.warn('  - Full logout URL:', logoutUrl.toString());
    
    // Add a delay so you can see the logs before redirect
    console.warn('⏳ Redirecting to logout in 3 seconds...');
    setTimeout(() => {
      window.location.href = logoutUrl.toString();
    }, 3000);
  }

  async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${OIDC_CONFIG.issuer}/v1/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: OIDC_CONFIG.clientId,
          refresh_token: this.refreshToken,
        }),
      });

      if (!response.ok) {
        return false;
      }

      const tokenData = await response.json();
      this.token = tokenData.access_token;
      this.refreshToken = tokenData.refresh_token || this.refreshToken;
      // Keep existing ID token (refresh doesn't typically return a new ID token)
      // this.idToken remains unchanged

      this.setStoredToken(this.token, this.refreshToken, this.idToken);
      this.notifyListeners();

      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  private generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, Array.from(array)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private async generateCodeChallenge(codeVerifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(digest))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
}

// Export singleton instance
export const oidcAuth = new OIDCAuthService();
