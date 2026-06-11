import { useState, useEffect } from 'react';
import api from '../../../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'; // Thư viện biểu đồ

const formatCurrency = (amount) => 
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

const FinancePage = () => {
  const [timeFilter, setTimeFilter] = useState('month'); // 'day', 'week', 'month'
  const [financeData, setFinanceData] = useState({
    summary: { gross: 0, commission: 0, refund: 0, net: 0 },
    chartData: []
  });
  const [loading, setLoading] = useState(false);

  // Hàm tính toán ngày dựa trên bộ lọc
  const getDateRange = (filter) => {
    const end = new Date();
    const start = new Date();
    if (filter === 'day') {
      start.setHours(0, 0, 0, 0); // Đầu ngày hôm nay
    } else if (filter === 'week') {
      start.setDate(end.getDate() - 7); // 7 ngày qua
    } else if (filter === 'month') {
      start.setDate(1); // Đầu tháng này
    }
    return { 
      startDate: start.toISOString(), 
      endDate: end.toISOString() 
    };
  };

  useEffect(() => {
    const fetchFinance = async () => {
      setLoading(true);
      try {
        const { startDate, endDate } = getDateRange(timeFilter);
        const res = await api.get(`/partner/finance/summary?startDate=${startDate}&endDate=${endDate}`);
        setFinanceData(res.data.data);
      } catch (error) {
        console.error("Lỗi lấy dữ liệu tài chính", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFinance();
  }, [timeFilter]);

  const { summary, chartData } = financeData;

  // Thành phần Thẻ (Card) thống kê
  const StatCard = ({ title, value, color, icon }) => (
    <div style={{
      background: '#fff', padding: '20px', borderRadius: '12px', flex: 1,
      boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderBottom: `4px solid ${color}`
    }}>
      <div style={{ color: '#5a7a72', fontSize: '14px', marginBottom: '8px', fontWeight: 500 }}>{title}</div>
      <div style={{ fontSize: '24px', fontWeight: 'bold', color: color }}>
        {formatCurrency(value)}
      </div>
    </div>
  );

  return (
    <div className="main-panel" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a2e28' }}>Quản lý Tài chính</h1>
        
        {/* Bộ lọc thời gian */}
        <select 
          value={timeFilter} 
          onChange={(e) => setTimeFilter(e.target.value)}
          style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid #8FD9C4', outline: 'none', background: '#e8f5f1', color: '#3C7363', fontWeight: '600' }}
        >
          <option value="day">Hôm nay</option>
          <option value="week">7 ngày qua</option>
          <option value="month">Tháng này</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#5a7a72' }}>⏳ Đang tải dữ liệu tài chính...</div>
      ) : (
        <>
          {/* KHỐI 1: CÁC THẺ TỔNG QUAN */}
          <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
            <StatCard title="Tổng doanh thu" value={summary.gross} color="#0984e3" />
            <StatCard title="Hoa hồng OTA" value={summary.commission} color="#d63031" />
            <StatCard title="Đã hoàn tiền" value={summary.refund} color="#e17055" />
            <StatCard title="Thực nhận (Net)" value={summary.net} color="#00b894" />
          </div>

          {/* KHỐI 2: BIỂU ĐỒ */}
          <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <h4 style={{ color: '#3C7363', marginBottom: '20px' }}>Biểu đồ doanh thu theo thời gian</h4>
            
            {chartData.length > 0 ? (
              <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer>
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis dataKey="date" tick={{fontSize: 12}} />
                    <YAxis tickFormatter={(val) => `${val / 1000000}M`} tick={{fontSize: 12}} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="doanh_thu" name="Tổng doanh thu" fill="#0984e3" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="thuc_nhan" name="Thực nhận" fill="#00b894" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999', border: '1px dashed #ccc', borderRadius: '8px' }}>
                Không có giao dịch nào trong khoảng thời gian này.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default FinancePage;