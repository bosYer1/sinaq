do $$
declare
  v_club_id uuid;
  v_pc_type_id uuid;
  v_ps_type_id uuid;
begin
  select id into v_club_id
  from public.clubs
  where slug = 'milli-gaming-arena'
  limit 1;

  if v_club_id is null then
    raise exception 'Milli Gaming Arena club not found';
  end if;

  select id into v_pc_type_id
  from public.club_types
  where slug = 'pc'
  limit 1;

  select id into v_ps_type_id
  from public.club_types
  where slug = 'playstation'
  limit 1;

  if v_pc_type_id is null or v_ps_type_id is null then
    raise exception 'Required PC/PlayStation club types not found';
  end if;

  insert into public.club_type_assignments (club_id, club_type_id)
  values
    (v_club_id, v_pc_type_id),
    (v_club_id, v_ps_type_id)
  on conflict do nothing;

  delete from public.club_pricing
  where club_id = v_club_id
    and club_type_id in (v_pc_type_id, v_ps_type_id);

  insert into public.club_pricing (
    club_id,
    club_type_id,
    price_from,
    price_to,
    unit,
    tariff_name,
    schedule_label,
    position
  ) values
    -- PC / həftə içi 15:00–00:00
    (v_club_id, v_pc_type_id, 1.50, null, 'saat', 'Premium', 'Həftə içi · 15:00–00:00', 0),
    (v_club_id, v_pc_type_id, 2.00, null, 'saat', 'Pro', 'Həftə içi · 15:00–00:00', 1),
    (v_club_id, v_pc_type_id, 2.20, null, 'saat', 'Pro+', 'Həftə içi · 15:00–00:00', 2),
    (v_club_id, v_pc_type_id, 3.50, null, 'saat', 'E-Sport', 'Həftə içi · 15:00–00:00', 3),

    -- PC / həftə içi 00:00–15:00
    (v_club_id, v_pc_type_id, 1.20, null, 'saat', 'Premium', 'Həftə içi · 00:00–15:00', 4),
    (v_club_id, v_pc_type_id, 1.50, null, 'saat', 'Pro', 'Həftə içi · 00:00–15:00', 5),
    (v_club_id, v_pc_type_id, 1.80, null, 'saat', 'Pro+', 'Həftə içi · 00:00–15:00', 6),
    (v_club_id, v_pc_type_id, 2.50, null, 'saat', 'E-Sport', 'Həftə içi · 00:00–15:00', 7),

    -- PC / həftə sonu 12:00–00:00
    (v_club_id, v_pc_type_id, 1.50, null, 'saat', 'Premium', 'Həftə sonu · 12:00–00:00', 8),
    (v_club_id, v_pc_type_id, 2.00, null, 'saat', 'Pro', 'Həftə sonu · 12:00–00:00', 9),
    (v_club_id, v_pc_type_id, 2.50, null, 'saat', 'Pro+', 'Həftə sonu · 12:00–00:00', 10),
    (v_club_id, v_pc_type_id, 3.50, null, 'saat', 'E-Sport', 'Həftə sonu · 12:00–00:00', 11),

    -- PC / həftə sonu 00:00–12:00
    (v_club_id, v_pc_type_id, 1.20, null, 'saat', 'Premium', 'Həftə sonu · 00:00–12:00', 12),
    (v_club_id, v_pc_type_id, 1.50, null, 'saat', 'Pro', 'Həftə sonu · 00:00–12:00', 13),
    (v_club_id, v_pc_type_id, 2.00, null, 'saat', 'Pro+', 'Həftə sonu · 00:00–12:00', 14),
    (v_club_id, v_pc_type_id, 2.80, null, 'saat', 'E-Sport', 'Həftə sonu · 00:00–12:00', 15),

    -- PC / gecə paketi 00:00–06:00
    (v_club_id, v_pc_type_id, 7.00, null, '6 saat paket', 'Premium', 'Gecə paketi · 00:00–06:00', 16),
    (v_club_id, v_pc_type_id, 8.00, null, '6 saat paket', 'Pro', 'Gecə paketi · 00:00–06:00', 17),
    (v_club_id, v_pc_type_id, 10.00, null, '6 saat paket', 'Pro+', 'Gecə paketi · 00:00–06:00', 18),
    (v_club_id, v_pc_type_id, 15.00, null, '6 saat paket', 'E-Sport', 'Gecə paketi · 00:00–06:00', 19),

    -- PlayStation / gündüz 09:00–23:59
    (v_club_id, v_ps_type_id, 2.00, null, 'saat', 'PlayStation 3', 'Gündüz · 09:00–23:59', 0),
    (v_club_id, v_ps_type_id, 3.00, null, 'saat', 'PlayStation 4 Pro', 'Gündüz · 09:00–23:59', 1),
    (v_club_id, v_ps_type_id, 4.00, null, 'saat', 'PlayStation 5', 'Gündüz · 09:00–23:59', 2),
    (v_club_id, v_ps_type_id, 3.00, null, 'saat', 'Xbox X', 'Gündüz · 09:00–23:59', 3),

    -- PlayStation / gecə 00:00–08:59
    (v_club_id, v_ps_type_id, 1.50, null, 'saat', 'PlayStation 3', 'Gecə · 00:00–08:59', 4),
    (v_club_id, v_ps_type_id, 2.00, null, 'saat', 'PlayStation 4 Pro', 'Gecə · 00:00–08:59', 5),
    (v_club_id, v_ps_type_id, 2.50, null, 'saat', 'PlayStation 5', 'Gecə · 00:00–08:59', 6),
    (v_club_id, v_ps_type_id, 2.00, null, 'saat', 'Xbox X', 'Gecə · 00:00–08:59', 7);
end;
$$;