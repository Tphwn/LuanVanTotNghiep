import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const PAYMENTS_API = '/admin/payments';
const FINANCE_API = '/admin/finance';

export const fetchFinanceOverview = createAsyncThunk(
  'adminFinance/overview',
  async () => (await api.get(`${FINANCE_API}/overview`)).data.data,
);

export const fetchPaymentStats = createAsyncThunk(
  'adminFinance/stats',
  async () => (await api.get(`${PAYMENTS_API}/stats`)).data.data,
);

export const fetchTransactions = createAsyncThunk(
  'adminFinance/transactions',
  async (f = {}) => (await api.get(`${PAYMENTS_API}/transactions`, { params: f })).data.data,
);

export const fetchTransactionById = createAsyncThunk(
  'adminFinance/txById',
  async (id) => (await api.get(`${PAYMENTS_API}/transactions/${id}`)).data.data,
);

export const fetchRefunds = createAsyncThunk(
  'adminFinance/refunds',
  async (f = {}) => (await api.get(`${PAYMENTS_API}/refunds`, { params: f })).data.data,
);

export const fetchRefundById = createAsyncThunk(
  'adminFinance/refundById',
  async (id) => (await api.get(`${PAYMENTS_API}/refunds/${id}`)).data.data,
);

export const fetchCommissions = createAsyncThunk(
  'adminFinance/commissions',
  async (f = {}) => (await api.get(`${PAYMENTS_API}/commissions`, { params: f })).data.data,
);

export const fetchCommissionPartner = createAsyncThunk(
  'adminFinance/commByPt',
  async () => (await api.get(`${PAYMENTS_API}/commissions/by-partner`)).data.data,
);

export const fetchReconciliations = createAsyncThunk(
  'adminFinance/reconciliations',
  async () => (await api.get(`${FINANCE_API}/reconciliations`)).data.data,
);

export const calculateReconciliation = createAsyncThunk(
  'adminFinance/calcReconcile',
  async ({ ma_doi_tac, thang_nam }, { rejectWithValue }) => {
    try {
      await api.post(`${FINANCE_API}/reconciliations/calculate`, { ma_doi_tac, thang_nam });
      return true;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Lỗi đối soát');
    }
  },
);

export const updateReconciliationStatus = createAsyncThunk(
  'adminFinance/updateReconcile',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      return (await api.patch(`${FINANCE_API}/reconciliations/${id}`, { status })).data.data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Lỗi cập nhật');
    }
  },
);

export const approveRefund = createAsyncThunk('adminFinance/approveRefund', async (id, { rejectWithValue }) => {
  try {
    return (await api.patch(`${PAYMENTS_API}/refunds/${id}/approve`)).data.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Lỗi duyệt');
  }
});

export const rejectRefund = createAsyncThunk('adminFinance/rejectRefund', async ({ id, ly_do }, { rejectWithValue }) => {
  try {
    return (await api.patch(`${PAYMENTS_API}/refunds/${id}/reject`, { ly_do })).data.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Lỗi từ chối');
  }
});

export const confirmCommission = createAsyncThunk('adminFinance/confirmComm', async (id, { rejectWithValue }) => {
  try {
    return (await api.patch(`${PAYMENTS_API}/commissions/${id}/confirm`)).data.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Lỗi xác nhận');
  }
});

const adminFinanceSlice = createSlice({
  name: 'adminFinance',
  initialState: {
    overview: null,
    stats: null,
    transactions: [],
    txDetail: null,
    detailLoading: false,
    refundDetail: null,
    refundDetailLoading: false,
    refunds: [],
    commissions: [],
    commByPartner: [],
    reconciliations: [],
    loading: false,
    reconcileLoading: false,
    error: null,
    successMsg: null,
  },
  reducers: {
    clearMsg: (st) => { st.error = null; st.successMsg = null; },
    clearDetail: (st) => { st.txDetail = null; },
    clearRefundDetail: (st) => { st.refundDetail = null; },
  },
  extraReducers: (b) => {
    const pend = (st) => { st.loading = true; };
    const done = (st) => { st.loading = false; };

    b
      .addCase(fetchFinanceOverview.fulfilled, (st, a) => { st.overview = a.payload; })
      .addCase(fetchPaymentStats.fulfilled, (st, a) => { st.stats = a.payload; })
      .addCase(fetchTransactions.pending, pend)
      .addCase(fetchTransactions.fulfilled, (st, a) => { done(st); st.transactions = a.payload; })
      .addCase(fetchTransactions.rejected, done)
      .addCase(fetchTransactionById.pending, (st) => { st.detailLoading = true; })
      .addCase(fetchTransactionById.fulfilled, (st, a) => {
        st.detailLoading = false;
        st.txDetail = a.payload;
      })
      .addCase(fetchTransactionById.rejected, (st) => { st.detailLoading = false; })
      .addCase(fetchRefunds.pending, pend)
      .addCase(fetchRefunds.fulfilled, (st, a) => { done(st); st.refunds = a.payload; })
      .addCase(fetchRefunds.rejected, done)
      .addCase(fetchRefundById.pending, (st) => { st.refundDetailLoading = true; })
      .addCase(fetchRefundById.fulfilled, (st, a) => {
        st.refundDetailLoading = false;
        st.refundDetail = a.payload;
      })
      .addCase(fetchRefundById.rejected, (st) => { st.refundDetailLoading = false; })
      .addCase(fetchCommissions.fulfilled, (st, a) => { st.commissions = a.payload; })
      .addCase(fetchCommissionPartner.fulfilled, (st, a) => { st.commByPartner = a.payload; })
      .addCase(fetchReconciliations.pending, (st) => { st.reconcileLoading = true; })
      .addCase(fetchReconciliations.fulfilled, (st, a) => {
        st.reconcileLoading = false;
        st.reconciliations = a.payload;
      })
      .addCase(fetchReconciliations.rejected, (st) => { st.reconcileLoading = false; })

      .addCase(calculateReconciliation.fulfilled, (st) => {
        st.successMsg = 'Đã tính toán đối soát thành công';
      })
      .addCase(calculateReconciliation.rejected, (st, a) => { st.error = a.payload; })

      .addCase(updateReconciliationStatus.fulfilled, (st, a) => {
        st.successMsg = 'Đã cập nhật trạng thái đối soát';
        const i = st.reconciliations.findIndex((x) => x.ma_doi_soat === a.payload.ma_doi_soat);
        if (i !== -1) st.reconciliations[i] = a.payload;
      })
      .addCase(updateReconciliationStatus.rejected, (st, a) => { st.error = a.payload; })

      .addCase(approveRefund.fulfilled, (st, a) => {
        st.successMsg = 'Đã hoàn tiền thành công!';
        const i = st.refunds.findIndex((x) => x.ma_hoan_tien === a.payload.ma_hoan_tien);
        if (i !== -1) st.refunds[i] = a.payload;
        if (st.refundDetail?.ma_hoan_tien === a.payload.ma_hoan_tien) {
          st.refundDetail = a.payload;
        }
      })
      .addCase(approveRefund.rejected, (st, a) => { st.error = a.payload; })

      .addCase(rejectRefund.fulfilled, (st, a) => {
        st.successMsg = 'Đã từ chối hoàn tiền!';
        const i = st.refunds.findIndex((x) => x.ma_hoan_tien === a.payload.ma_hoan_tien);
        if (i !== -1) st.refunds[i] = { ...st.refunds[i], trang_thai: 'tu_choi' };
      })
      .addCase(rejectRefund.rejected, (st, a) => { st.error = a.payload; })

      .addCase(confirmCommission.fulfilled, (st, a) => {
        st.successMsg = 'Đã xác nhận thu hoa hồng!';
        const i = st.commissions.findIndex((x) => x.ma_hoa_hong === a.payload.ma_hoa_hong);
        if (i !== -1) st.commissions[i] = { ...st.commissions[i], trang_thai: 'da_thu' };
      });
  },
});

export const { clearMsg, clearDetail, clearRefundDetail } = adminFinanceSlice.actions;
export default adminFinanceSlice.reducer;
