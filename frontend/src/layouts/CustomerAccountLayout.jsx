import {Outlet} from 'react-router-dom';
import CustomerAccountSidebar from '../components/customer/account/CustomerAccountSidebar';
import '../assets/styles/account.css';
const CustomerAccountLayout = () => (
    <div className="account-layout">
        <CustomerAccountSidebar />
        <main className="account-main">
            <Outlet />
        </main>
    </div>  
);
export default CustomerAccountLayout;