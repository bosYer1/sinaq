-- Add WhatsApp reservation-request intent to the existing privacy-safe first-party CTA analytics contract.
-- This event remains intent-only; it is not proof of a confirmed reservation, customer, payment, or sale.

alter table public.analytics_events
  drop constraint if exists analytics_events_type_valid;

alter table public.analytics_events
  add constraint analytics_events_type_valid
  check (
    event_type = any (
      array[
        'maps_click'::text,
        'phone_click'::text,
        'instagram_click'::text,
        'club_correction_click'::text,
        'whatsapp_booking_click'::text
      ]
    )
  );
