export type EmailSubscriber = {
  id: number;
  email: string;
  state: string | null;
  source: string | null;
  is_subscribed: boolean;
  unsubscribed_at: string | null;
  created_at: string;
  updated_at: string;
};
