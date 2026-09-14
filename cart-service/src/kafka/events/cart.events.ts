export type CartEventType =
  | 'CartCreated'
  | 'CartItemAdded'
  | 'CartItemUpdated'
  | 'CartItemRemoved'
  | 'CartCleared'
  | 'CartStatusChanged'
  | 'CartAbandoned'
  | 'CartConverted';

export interface CartDomainEvent<T = any> {
  event_id: string;
  event_type: CartEventType;
  entity_type: 'Cart' | 'CartItem';
  entity_id: string;
  timestamp: string;
  payload: T;
}
