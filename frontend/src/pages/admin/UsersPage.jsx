import { useState } from 'react';

const UsersPage = () => {
  const [search, setSearch] = useState('');

  const users = [
    {
      id: 1,
      ho_ten: 'Admin',
      email: 'admin@gmail.com',
      vai_tro: 'Admin',
    },
    {
      id: 2,
      ho_ten: 'Đối tác A',
      email: 'partner@gmail.com',
      vai_tro: 'Đối tác',
    },
    {
      id: 3,
      ho_ten: 'Nguyễn Văn A',
      email: 'user@gmail.com',
      vai_tro: 'Khách hàng',
    },
  ];

  const filteredUsers = users.filter(
    (user) =>
      user.ho_ten.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <h1>👥 Quản lý người dùng</h1>

        <button
          style={{
            background: '#117d62',
            color: '#fff',
            border: 'none',
            padding: '10px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          + Thêm người dùng
        </button>
      </div>

      <input
        type="text"
        placeholder="Tìm kiếm người dùng..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: '300px',
          padding: '10px',
          marginBottom: '20px',
          borderRadius: '8px',
          border: '1px solid #ddd',
        }}
      />

      <div
        style={{
          background: '#fff',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
          }}
        >
          <thead>
            <tr
              style={{
                background: '#f5f5f5',
              }}
            >
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Họ tên</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Vai trò</th>
              <th style={thStyle}>Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td style={tdStyle}>{user.id}</td>
                <td style={tdStyle}>{user.ho_ten}</td>
                <td style={tdStyle}>{user.email}</td>
                <td style={tdStyle}>{user.vai_tro}</td>

                <td style={tdStyle}>
                  <button style={editBtn}>
                    Sửa
                  </button>

                  <button style={deleteBtn}>
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const thStyle = {
  padding: '14px',
  textAlign: 'left',
  borderBottom: '1px solid #ddd',
};

const tdStyle = {
  padding: '14px',
  borderBottom: '1px solid #eee',
};

const editBtn = {
  background: '#1677ff',
  color: '#fff',
  border: 'none',
  padding: '6px 12px',
  borderRadius: '6px',
  cursor: 'pointer',
  marginRight: '8px',
};

const deleteBtn = {
  background: '#ff4d4f',
  color: '#fff',
  border: 'none',
  padding: '6px 12px',
  borderRadius: '6px',
  cursor: 'pointer',
};

export default UsersPage;