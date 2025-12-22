export function isSignedIn(): boolean {
  return localStorage.getItem('ffc_signed_in') === '1';
}

export async function signIn(): Promise<void> {
  // Simple placeholder: ask user to confirm sign-in. Replace with real provider as needed.
  const ok = confirm('Sign in to enable saving to backend?');
  if (ok) localStorage.setItem('ffc_signed_in', '1');
}

export function signOut(): void {
  localStorage.removeItem('ffc_signed_in');
}