'use client';

import { useMemo, useState } from 'react';
import type { ClubType } from '@/types/database';

type PricingDraft = {
  id?: string;
  club_type_id: string;
  price_from: number | '';
  price_to: number | '';
  unit: string;
  tariff_name: string;
  schedule_label: string;
  position: number;
};

type ExistingPricing = {
  id: string;
  club_type_id: string;
  price_from: number;
  price_to: number | null;
  unit: string;
  tariff_name?: string | null;
  schedule_label?: string | null;
  position?: number;
};

type Props = {
  types: ClubType[];
  enabledTypeIds: string[];
  pricing: ExistingPricing[];
};

function emptyRow(typeId: string, position: number): PricingDraft {
  return {
    club_type_id: typeId,
    price_from: '',
    price_to: '',
    unit: 'saat',
    tariff_name: '',
    schedule_label: '',
    position,
  };
}

export function ClubPricingEditor({ types, enabledTypeIds, pricing }: Props) {
  const [enabled, setEnabled] = useState(() => new Set(enabledTypeIds));
  const [rows, setRows] = useState<PricingDraft[]>(() => {
    const initial: PricingDraft[] = pricing.map((item, index) => ({
      id: item.id,
      club_type_id: item.club_type_id,
      price_from: item.price_from,
      price_to: item.price_to == null ? '' : item.price_to,
      unit: item.unit || 'saat',
      tariff_name: item.tariff_name ?? '',
      schedule_label: item.schedule_label ?? '',
      position: item.position ?? index,
    }));
    return initial;
  });

  const serializedRows = useMemo(
    () =>
      JSON.stringify(
        rows
          .filter((row) => enabled.has(row.club_type_id))
          .map((row, index) => ({
            club_type_id: row.club_type_id,
            price_from: row.price_from === '' ? null : Number(row.price_from),
            price_to: row.price_to === '' ? null : Number(row.price_to),
            unit: row.unit.trim() || 'saat',
            tariff_name: row.tariff_name.trim() || null,
            schedule_label: row.schedule_label.trim() || null,
            position: index,
          }))
      ),
    [rows, enabled]
  );

  function toggleType(typeId: string, checked: boolean) {
    setEnabled((current) => {
      const next = new Set(current);
      if (checked) next.add(typeId);
      else next.delete(typeId);
      return next;
    });
  }

  function addRow(typeId: string) {
    setRows((current) => [...current, emptyRow(typeId, current.length)]);
  }

  function updateRow(index: number, patch: Partial<PricingDraft>) {
    setRows((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
  }

  function removeRow(index: number) {
    setRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
  }

  const inputClass =
    'mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-[#7C5CFC] focus:ring-2 focus:ring-[#7C5CFC]/10';

  return (
    <div className="mt-4 space-y-4">
      <input type="hidden" name="pricing_json" value={serializedRows} />

      {types.map((type) => {
        const typeRows = rows
          .map((row, index) => ({ row, index }))
          .filter(({ row }) => row.club_type_id === type.id);
        const isEnabled = enabled.has(type.id);

        return (
          <div key={type.id} className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  name={`type_enabled_${type.id}`}
                  checked={isEnabled}
                  onChange={(event) => toggleType(type.id, event.target.checked)}
                />
                {type.name}
              </label>
              <button
                type="button"
                disabled={!isEnabled}
                onClick={() => addRow(type.id)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                + Tarif əlavə et
              </button>
            </div>

            {isEnabled ? (
              <div className="mt-3 space-y-3">
                {typeRows.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-3 text-xs text-gray-500">
                    Qiymət məlum deyilsə tarif əlavə etmədən tipi aktiv saxlaya bilərsən.
                  </div>
                ) : null}

                {typeRows.map(({ row, index }, visibleIndex) => (
                  <div key={row.id ?? `${type.id}-${index}`} className="rounded-lg border border-gray-200 bg-white p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-gray-500">Tarif {visibleIndex + 1}</span>
                      <button type="button" onClick={() => removeRow(index)} className="text-xs font-semibold text-red-600 hover:underline">
                        Sil
                      </button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      <label className="text-xs font-medium text-gray-600">
                        Tarif / zona adı
                        <input
                          value={row.tariff_name}
                          onChange={(event) => updateRow(index, { tariff_name: event.target.value })}
                          maxLength={80}
                          placeholder="Premium, Pro+, PS5..."
                          className={inputClass}
                        />
                      </label>
                      <label className="text-xs font-medium text-gray-600">
                        Vaxt / şərt
                        <input
                          value={row.schedule_label}
                          onChange={(event) => updateRow(index, { schedule_label: event.target.value })}
                          maxLength={120}
                          placeholder="Həftəiçi 15:00–00:00"
                          className={inputClass}
                        />
                      </label>
                      <label className="text-xs font-medium text-gray-600">
                        Vahid
                        <input value={row.unit} onChange={(event) => updateRow(index, { unit: event.target.value })} maxLength={30} className={inputClass} />
                      </label>
                      <label className="text-xs font-medium text-gray-600">
                        Qiymət — dan
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={row.price_from}
                          onChange={(event) => updateRow(index, { price_from: event.target.value === '' ? '' : Number(event.target.value) })}
                          className={inputClass}
                        />
                      </label>
                      <label className="text-xs font-medium text-gray-600">
                        Qiymət — dək
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={row.price_to}
                          onChange={(event) => updateRow(index, { price_to: event.target.value === '' ? '' : Number(event.target.value) })}
                          className={inputClass}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
