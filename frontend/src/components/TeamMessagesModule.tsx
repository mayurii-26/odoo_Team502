'use client'

import React from 'react'
import { UserRole, Quotation, ActiveModule, UserSession, UserAccount } from './types'
import ChatModule from './ChatModule'

interface TeamMessagesProps {
  role: UserRole
  quotations?: Quotation[]
  onNavigate?: (module: ActiveModule) => void
  onShowToast: (msg: string) => void
  currentUser?: UserSession
  users?: UserAccount[]
}

export default function TeamMessagesModule({
  role,
  onShowToast,
  currentUser,
  users,
}: TeamMessagesProps) {
  const isFinance = role === 'finance'
  const fallbackUser: UserSession = {
    id: isFinance ? 'fin-1' : 'mgr-1',
    fullName: isFinance ? 'David Miller' : 'Alex Rivera',
    email: isFinance ? 'finance@dealflow360.com' : 'manager@dealflow360.com',
    role: role,
  }

  return (
    <ChatModule
      currentUser={currentUser || fallbackUser}
      users={users}
      onShowToast={onShowToast}
    />
  )
}
