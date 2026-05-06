'use client';

import { createContext, useContext, ReactNode } from 'react';

interface PermissionContextType {
  permissions: string[];
  role: string;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export function PermissionProvider({ 
  children, 
  permissions, 
  role 
}: { 
  children: ReactNode; 
  permissions: string[]; 
  role: string;
}) {
  return (
    <PermissionContext.Provider value={{ permissions, role }}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
}
