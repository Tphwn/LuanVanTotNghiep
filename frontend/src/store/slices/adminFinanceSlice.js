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
  async (f = {}, { rejectWithValue }) => {
    try {
      return (await api.get(`${PAYMENTS_API}/commissions`, { params: f })).data.data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Lỗi tải hoa hồng');
    }
  },
);

export const fetchCommissionStats = createAsyncThunk(
  'adminFinance/commStats',
  async (f = {}, { rejectWithValue }) => {
    try {
      return (await api.get(`${PAYMENTS_API}/commissions/stats`, { params: f })).data.data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Lỗi tải thống kê hoa hồng');
    }
  },
);

export const fetchCommissionById = createAsyncThunk(
  'adminFinance/commById',
  async (id, { rejectWithValue }) => {
    try {
      return (await api.get(`${PAYMENTS_API}/commissions/${id}`)).data.data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Lỗi tải chi tiết hoa hồng');
    }
  },
);

export const fetchCommissionPartner = createAsyncThunk(
  'adminFinance/commByPt',
  async () => (await api.get(`${PAYMENTS_API}/commissions/by-partner`)).data.data,
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
    return rejectWithValue(e.response?.data?.message || 'Lỗi xác nhận đối soát');
  }
});

export const holdCommission = createAsyncThunk('adminFinance/holdComm', async (id, { rejectWithValue }) => {
  try {
    return (await api.patch(`${PAYMENTS_API}/commissions/${id}/hold`)).data.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Lỗi tạm giữ');
  }
});

export const releaseCommissionHold = createAsyncThunk('adminFinance/releaseComm', async (id, { rejectWithValue }) => {
  try {
    return (await api.patch(`${PAYMENTS_API}/commissions/${id}/release-hold`)).data.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Lỗi bỏ tạm giữ');
  }
});

export const fetchPartnerPayouts = createAsyncThunk(
  'adminFinance/partnerPayouts',
  async (f = {}, { rejectWithValue }) => {
    try {
      return (await api.get(`${PAYMENTS_API}/partner-payments`, { params: f })).data.data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Lỗi tải thanh toán đối tác');
    }
  },
);

export const fetchPartnerPayoutStats = createAsyncThunk(
  'adminFinance/partnerPayoutStats',
  async (f = {}, { rejectWithValue }) => {
    try {
      return (await api.get(`${PAYMENTS_API}/partner-payments/stats`, { params: f })).data.data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Lỗi tải thống kê thanh toán đối tác');
    }
  },
);

export const fetchPartnerPayoutById = createAsyncThunk(
  'adminFinance/partnerPayoutById',
  async (maDoiTac, { rejectWithValue }) => {
    try {
      return (await api.get(`${PAYMENTS_API}/partner-payments/${maDoiTac}`)).data.data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Lỗi tải chi tiết thanh toán đối tác');
    }
  },
);

export const confirmPartnerPayout = createAsyncThunk(
  'adminFinance/confirmPartnerPayout',
  async ({ maDoiTac, ...payload }, { rejectWithValue }) => {
    try {
      return (await api.patch(`${PAYMENTS_API}/partner-payments/${maDoiTac}/confirm`, payload)).data.data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Lỗi xác nhận thanh toán đối tác');
    }
  },
);

export const releasePartnerPayoutHold = createAsyncThunk(
  'adminFinance/releasePartnerPayoutHold',
  async (maDoiTac, { rejectWithValue }) => {
    try {
      return (await api.patch(`${PAYMENTS_API}/partner-payments/${maDoiTac}/release-hold`)).data.data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || 'Lỗi bỏ tạm giữ thanh toán');
    }
  },
);

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
    commissionStats: null,
    commissionDetail: null,
    commissionDetailLoading: false,
    commByPartner: [],
    partnerPayouts: [],
    partnerPayoutStats: null,
    partnerPayoutDetail: null,
    partnerPayoutDetailLoading: false,
    loading: false,
    error: null,
    successMsg: null,
  },
  reducers: {
    clearMsg: (st) => { st.error = null; st.successMsg = null; },
    clearDetail: (st) => { st.txDetail = null; },
    clearRefundDetail: (st) => { st.refundDetail = null; },
    clearCommissionDetail: (st) => { st.commissionDetail = null; },
    clearPartnerPayoutDetail: (st) => { st.partnerPayoutDetail = null; },
  },
  extraReducers: (b) => {
    const pend = (st) => { st.loading = true; };
    const done = (st) => { st.loading = false; };
    const upsertCommission = (st, payload) => {
      if (!payload?.ma_hoa_hong) return;
      const i = st.commissions.findIndex((x) => x.ma_hoa_hong === payload.ma_hoa_hong);
      if (i !== -1) st.commissions[i] = { ...st.commissions[i], ...payload };
      if (st.commissionDetail?.ma_hoa_hong === payload.ma_hoa_hong) {
        st.commissionDetail = { ...st.commissionDetail, ...payload };
      }
    };

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
      .addCase(fetchCommissions.fulfilled, (st, a) => { st.commissions = a.payload || []; })
      .addCase(fetchCommissionStats.fulfilled, (st, a) => { st.commissionStats = a.payload; })
      .addCase(fetchCommissionById.pending, (st) => { st.commissionDetailLoading = true; })
      .addCase(fetchCommissionById.fulfilled, (st, a) => {
        st.commissionDetailLoading = false;
        st.commissionDetail = a.payload;
      })
      .addCase(fetchCommissionById.rejected, (st) => { st.commissionDetailLoading = false; })
      .addCase(fetchCommissionPartner.fulfilled, (st, a) => { st.commByPartner = a.payload; })

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
        st.successMsg = 'Đã xác nhận đối soát hoa hồng';
        upsertCommission(st, a.payload);
      })
      .addCase(confirmCommission.rejected, (st, a) => { st.error = a.payload; })
      .addCase(holdCommission.fulfilled, (st, a) => {
        st.successMsg = 'Đã tạm giữ hoa hồng';
        upsertCommission(st, a.payload);
      })
      .addCase(holdCommission.rejected, (st, a) => { st.error = a.payload; })
      .addCase(releaseCommissionHold.fulfilled, (st, a) => {
        st.successMsg = 'Đã bỏ tạm giữ hoa hồng';
        upsertCommission(st, a.payload);
      })
      .addCase(releaseCommissionHold.rejected, (st, a) => { st.error = a.payload; })

      .addCase(fetchPartnerPayouts.fulfilled, (st, a) => { st.partnerPayouts = a.payload || []; })
      .addCase(fetchPartnerPayoutStats.fulfilled, (st, a) => { st.partnerPayoutStats = a.payload; })
      .addCase(fetchPartnerPayoutById.pending, (st) => { st.partnerPayoutDetailLoading = true; })
      .addCase(fetchPartnerPayoutById.fulfilled, (st, a) => {
        st.partnerPayoutDetailLoading = false;
        st.partnerPayoutDetail = a.payload;
      })
      .addCase(fetchPartnerPayoutById.rejected, (st) => { st.partnerPayoutDetailLoading = false; })
      .addCase(confirmPartnerPayout.fulfilled, (st, a) => {
        st.successMsg = 'Đã xác nhận thanh toán đối tác';
        st.partnerPayoutDetail = a.payload;
      })
      .addCase(confirmPartnerPayout.rejected, (st, a) => { st.error = a.payload; })
      .addCase(releasePartnerPayoutHold.fulfilled, (st, a) => {
        st.successMsg = 'Đã bỏ tạm giữ thanh toán đối tác';
        st.partnerPayoutDetail = a.payload;
      })
      .addCase(releasePartnerPayoutHold.rejected, (st, a) => { st.error = a.payload; });
  },
});

export const {
  clearMsg,
  clearDetail,
  clearRefundDetail,
  clearCommissionDetail,
  clearPartnerPayoutDetail,
} = adminFinanceSlice.actions;
export default adminFinanceSlice.reducer;
