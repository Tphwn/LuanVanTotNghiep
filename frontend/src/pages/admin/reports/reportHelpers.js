import { useMemo, useState } from 'react';

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const toInputDate = (d) => {
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const REPORT_DATE_PRESETS = [
  { value: 'today', label: 'Hôm nay' },
  { value: 'week', label: 'Tuần này' },
  { value: 'month', label: 'Tháng này' },
  { value: 'year', label: 'Năm nay' },
  { value: 'custom', label: 'Tùy chọn' },
];

export const getPresetRange = (preset) => {
  const now = new Date();
  if (preset === 'today') {
    return { tu_ngay: toInputDate(now), den_ngay: toInputDate(now) };
  }
  if (preset === 'week') {
    const day = now.getDay() || 7;
    const from = startOfDay(now);
    from.setDate(from.getDate() - (day - 1));
    return { tu_ngay: toInputDate(from), den_ngay: toInputDate(now) };
  }
  if (preset === 'month') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return { tu_ngay: toInputDate(from), den_ngay: toInputDate(now) };
  }
  if (preset === 'year') {
    const from = new Date(now.getFullYear(), 0, 1);
    return { tu_ngay: toInputDate(from), den_ngay: toInputDate(now) };
  }
  return { tu_ngay: '', den_ngay: '' };
};

export const useReportDateFilter = (defaultPreset = 'month') => {
  const initial = getPresetRange(defaultPreset);
  const [preset, setPreset] = useState(defaultPreset);
  const [tuNgay, setTuNgay] = useState(initial.tu_ngay);
  const [denNgay, setDenNgay] = useState(initial.den_ngay);

  const query = useMemo(() => {
    const q = {};
    if (tuNgay) q.tu_ngay = tuNgay;
    if (denNgay) q.den_ngay = denNgay;
    return q;
  }, [tuNgay, denNgay]);

  const applyPreset = (value) => {
    setPreset(value);
    if (value !== 'custom') {
      const range = getPresetRange(value);
      setTuNgay(range.tu_ngay);
      setDenNgay(range.den_ngay);
    }
  };

  return {
    preset,
    tuNgay,
    denNgay,
    query,
    setTuNgay: (v) => {
      setPreset('custom');
      setTuNgay(v);
    },
    setDenNgay: (v) => {
      setPreset('custom');
      setDenNgay(v);
    },
    applyPreset,
  };
};

export const BOOKING_STATUS_LABEL = {
  cho_xac_nhan: 'Chờ xác nhận',
  da_xac_nhan: 'Đã xác nhận',
  da_checkin: 'Đã check-in',
  tu_choi: 'Từ chối',
  hoan_thanh: 'Hoàn thành',
  da_huy: 'Đã hủy',
};

export const formatAxisMoney = (value) => {
  const n = Number(value) || 0;
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}tỷ`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}tr`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
};

export const CHART_COLORS = [
  '#3C7363',
  '#7CB59E',
  '#b36b00',
  '#0958d9',
  '#e05c5c',
  '#7c3aed',
  '#0ea5e9',
  '#16a34a',
];

export const PRESET_PERIOD_LABEL = {
  today: 'ngày',
  week: 'tuần',
  month: 'tháng',
  year: 'năm',
  custom: 'tùy chọn',
};

/** Màu badge tỉ lệ rủi ro (hủy / hoàn): <30 xanh, 30–70 cam, ≥70 đỏ */
export const riskRateTone = (rate) => {
  const n = Number(rate) || 0;
  if (n >= 70) return 'danger';
  if (n >= 30) return 'warning';
  return 'success';
};
