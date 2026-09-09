# Return-loop analytics events

All events use the existing `trackPostHogEvent` helper, so production/test traffic scope rules remain consistent.

- `club_update_impression`: update card rendered to a public visitor.
- `club_update_club_click`: visitor transitions from an update card to the related club profile.
- `club_update_source_click`: visitor opens the verified external source.

Required properties: `update_id`, `update_kind`, `club_id`, `club_slug`, `context`. Source clicks also include `source_type`.

These events must be interpreted with existing downstream `club_view` and CTA events rather than as standalone conversion proof.
