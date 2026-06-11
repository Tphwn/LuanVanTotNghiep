import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const BASE = '/admin/payments';

export const fetchPaymentStats      = createAsyncThunk('adminPayment/stats',       async () => (await api.get(`${BASE}/stats`)).data.data);
export const fetchTransactions      = createAsyncThunk('adminPayment/transactions', async (f={}) => (await api.get(`${BASE}/transactions`, { params: f })).data.data);
export const fetchTransactionById   = createAsyncThunk('adminPayment/txById',      async (id) => (await api.get(`${BASE}/transactions/${id}`)).data.data);
export const fetchRefunds           = createAsyncThunk('adminPayment/refunds',     async (f={}) => (await api.get(`${BASE}/refunds`, { params: f })).data.data);
export const fetchCommissions       = createAsyncThunk('adminPayment/commissions', async (f={}) => (await api.get(`${BASE}/commissions`, { params: f })).data.data);
export const fetchCommissionPartner = createAsyncThunk('adminPayment/commByPt',   async () => (await api.get(`${BASE}/commissions/by-partner`)).data.data);
export const fetchPartnerPayments   = createAsyncThunk('adminPayment/partnerPay', async () => (await api.get(`${BASE}/partner-payments`)).data.data);

export const approveRefund = createAsyncThunk('adminPayment/approveRefund', async (id, { rejectWithValue }) => {
  try { return (await api.patch(`${BASE}/refunds/${id}/approve`)).data.data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Lỗi duyệt'); }
});

export const rejectRefund = createAsyncThunk('adminPayment/rejectRefund', async ({ id, ly_do }, { rejectWithValue }) => {
  try { return (await api.patch(`${BASE}/refunds/${id}/reject`, { ly_do })).data.data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Lỗi từ chối'); }
});

export const confirmCommission = createAsyncThunk('adminPayment/confirmComm', async (id, { rejectWithValue }) => {
  try { return (await api.patch(`${BASE}/commissions/${id}/confirm`)).data.data; }
  catch (e) { return rejectWithValue(e.response?.data?.message || 'Lỗi xác nhận'); }
});

const s = createSlice({
  name: 'adminPayment',
  initialState: {
    stats: null, transactions: [], txDetail: null,
    refunds: [], commissions: [], commByPartner: [],
    partnerPayments: [], loading: false, error: null, successMsg: null,
  },
  reducers: {
    clearMsg:    (st) => { st.error = null; st.successMsg = null; },
    clearDetail: (st) => { st.txDetail = null; },
  },
  extraReducers: (b) => {
    const pend = (st) => { st.loading = true; };
    const done = (st) => { st.loading = false; };

    b
      .addCase(fetchPaymentStats.fulfilled,      (st, a) => { st.stats = a.payload; })
      .addCase(fetchTransactions.pending,        pend)
      .addCase(fetchTransactions.fulfilled,      (st, a) => { done(st); st.transactions = a.payload; })
      .addCase(fetchTransactions.rejected,       done)
      .addCase(fetchTransactionById.fulfilled,   (st, a) => { st.txDetail = a.payload; })
      .addCase(fetchRefunds.fulfilled,           (st, a) => { st.refunds = a.payload; })
      .addCase(fetchCommissions.fulfilled,       (st, a) => { st.commissions = a.payload; })
      .addCase(fetchCommissionPartner.fulfilled, (st, a) => { st.commByPartner = a.payload; })
      .addCase(fetchPartnerPayments.fulfilled,   (st, a) => { st.partnerPayments = a.payload; })

      .addCase(approveRefund.fulfilled, (st, a) => {
        st.successMsg = 'Đã duyệt hoàn tiền!';
        const i = st.refunds.findIndex(x => x.ma_hoan_tien === a.payload.ma_hoan_tien);
        if (i !== -1) st.refunds[i] = { ...st.refunds[i], trang_thai: 'da_hoan' };
      })
      .addCase(approveRefund.rejected, (st, a) => { st.error = a.payload; })

      .addCase(rejectRefund.fulfilled, (st, a) => {
        st.successMsg = 'Đã từ chối hoàn tiền!';
        const i = st.refunds.findIndex(x => x.ma_hoan_tien === a.payload.ma_hoan_tien);
        if (i !== -1) st.refunds[i] = { ...st.refunds[i], trang_thai: 'tu_choi' };
      })
      .addCase(rejectRefund.rejected, (st, a) => { st.error = a.payload; })

      .addCase(confirmCommission.fulfilled, (st, a) => {
        st.successMsg = 'Đã xác nhận thu hoa hồng!';
        const i = st.commissions.findIndex(x => x.ma_hoa_hong === a.payload.ma_hoa_hong);
        if (i !== -1) st.commissions[i] = { ...st.commissions[i], trang_thai: 'da_thu' };
      });
  },
});

export const { clearMsg, clearDetail } = s.actions;
export default s.reducer;