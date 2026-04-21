export type SessionUser = {
  id: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
};

export type AuthLoginResult = SessionUser & {
  token: string;
};
