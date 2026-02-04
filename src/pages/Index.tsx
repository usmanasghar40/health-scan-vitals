import React from 'react';
import AppLayout from '@/components/AppLayout';
import { AppProvider } from '@/contexts/AppContext';
import { UserProvider } from '@/contexts/UserContext';

const Index: React.FC = () => {
  return (
    <AppProvider>
      <UserProvider>
        <AppLayout />
      </UserProvider>
    </AppProvider>
  );
};

export default Index;
