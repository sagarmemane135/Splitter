export interface User {
  id: string;
  name: string;
}

export interface Payer {
  userId: string;
  amount: number;
}

export interface Participant {
  userId: string;
  share: number; // Represents amount or percentage based on splitType
}

export type SplitType = 'equal' | 'amount' | 'percentage';

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  payers: Payer[];
  participants: Participant[];
  splitType: SplitType;
  date: string;
  comments: Comment[];
}

export interface Balance {
  user: User;
  amount: number;
}

export interface Transaction {
  from: User;
  to: User;
  amount: number;
}

export interface Group {
  id: string;
  name: string;
  users: User[];
  expenses: Expense[];
}

export type CollabPayload =
  | { type: 'GROUP_UPDATE'; group: Group }
  | { type: 'JOIN_REQUEST'; name: string }
  | { type: 'GROUP_SYNC'; group: Group; assignedUser: User };