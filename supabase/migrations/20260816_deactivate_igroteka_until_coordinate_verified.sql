-- GameYer truth audit follow-up — 2026-08-16
-- IGROTEKA CYBER CLUB is a real club and its address/phone/hours are sourced,
-- but its stored coordinates were identical to Marvel PS Club & Lounge.
-- Marvel's exact plus-code resolves to that coordinate, so IGROTEKA must not
-- remain public with the duplicated marker. Reactivate only after an exact,
-- independently verified 4B coordinate is available.

update clubs
set is_active = false,
    updated_at = now()
where slug = 'igroteka-cyber-club';
