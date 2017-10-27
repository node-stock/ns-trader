export enum OrderSide {
  Buy = 'buy',
  Sell = 'sell'
}

export enum OrderType {
  Limit = 'limit',
  Market = 'market'
}

export enum TradeType {
  Spot = 'spot',
  Margin = 'margin'
}

export enum EventType {
  Order = 'order',
  Cancel = 'cancel'
}

export interface Event {
  eventId?: number,
  eventType: EventType
}

export interface Cancel extends Event {
  tradeType: TradeType,
  targetId: number
}

export interface BaseOrder extends Event {
  symbol: string,
  tradeType: TradeType,
  orderType: OrderType,
  side: OrderSide,
  price?: number,
  amount: number
}

export interface LimitOrder extends BaseOrder {
  orderType: OrderType.Limit,
  price: number
}

export interface MarketOrder extends BaseOrder {
  orderType: OrderType.Market
}

export type Order = LimitOrder | MarketOrder;
