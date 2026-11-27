export type SendModality = 'speech' | 'sign' | 'text' | 'board';
export type ReceiveModality = 'audio' | 'isl' | 'text' | 'haptic';

export interface CommunicationPreferences {
  name: string;
  spokenLanguage: string;
  writtenLanguage: string;
  signLanguage: 'ISL';
  sendMethods: SendModality[];
  receiveMethods: ReceiveModality[];
  fontScale: number;
  speechRate: number;
  highContrast: boolean;
  haptics: boolean;
  captionsEnabled: boolean;
}

export interface NearbySession {
  roomCode: string;
  token: string;
  expiresAt: string;
  status: 'waiting' | 'pending_acceptance' | 'connected' | 'ended';
  participants: Array<{
    id: string;
    name: string;
    sendMethods: SendModality[];
    receiveMethods: ReceiveModality[];
    language: string;
  }>;
}

export interface ConversationMessage {
  id: string;
  fromId: string;
  fromName: string;
  language: string;
  text: string;
  translatedText?: string;
  modality: 'speech' | 'text' | 'sign-card' | 'sign-heuristic';
  gloss?: string;
  confidence?: number | null;
  timestamp: number;
}
