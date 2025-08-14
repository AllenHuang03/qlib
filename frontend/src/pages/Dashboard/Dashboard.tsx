import React, { useState } from 'react';
import { Box } from '@mui/material';
import { useAuthStore } from '../../store/authStore';
import CustomerDashboard from './CustomerDashboard';
import TraderDashboard from './TraderDashboard';
import AdminDashboard from './AdminDashboard';
import KYCModal from '../../components/KYC/KYCModal';

const Dashboard: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const [kycModalOpen, setKycModalOpen] = useState(false);

  const handleStartKYC = () => {
    setKycModalOpen(true);
  };

  const handleKYCComplete = (userRole: 'customer' | 'trader') => {
    // Update user role and KYC status
    updateUser({
      ...user,
      role: userRole,
      kyc_status: 'approved'
    });
    setKycModalOpen(false);
  };

  const handleKYCClose = () => {
    setKycModalOpen(false);
  };

  // Route to appropriate dashboard based on user role
  const renderDashboard = () => {
    switch (user?.role) {
      case 'admin':
        return <AdminDashboard user={user} />;
      case 'trader':
        return <TraderDashboard user={user} onStartKYC={handleStartKYC} />;
      case 'customer':
      default:
        return <CustomerDashboard user={user} onStartKYC={handleStartKYC} />;
    }
  };

  return (
    <Box>
      {renderDashboard()}
      
      <KYCModal
        open={kycModalOpen}
        onClose={handleKYCClose}
        onComplete={handleKYCComplete}
      />
    </Box>
  );
};

export default Dashboard;