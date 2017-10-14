export enum OrderSide {
  Buy = 'buy',
  Sell = 'sell'
}

export enum OrderType {
  Limit = 'limit',
  Market = 'market'
}

/**
 *  交易类型
 */
export enum TradeType {
  /**
   *  现货交易
   */
  Spot = 'spot',
  /**
   *  信用交易
   */
  Margin = 'margin'
}

export enum EventType {
  Order = 'order',
  Cancel = 'cancel'
}

export interface Event {
  eventId: number,
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
  price?: string,
  amount: string
}

export interface LimitOrder extends BaseOrder {
  orderType: OrderType.Limit,
  price: string
}

export interface MarketOrder extends BaseOrder {
  orderType: OrderType.Market
}

export type Order = LimitOrder | MarketOrder;
