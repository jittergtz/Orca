alter table public.billing_subscriptions
  drop constraint if exists billing_subscriptions_status_check;

alter table public.billing_subscriptions
  add constraint billing_subscriptions_status_check
  check (status in ('trialing','active','past_due','canceled','unpaid','incomplete','incomplete_expired','paused'));
