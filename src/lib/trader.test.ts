import { WebTrader } from './trader';
import * as types from './types';
import * as assert from 'power-assert';

let trader: WebTrader;
const order: types.LimitOrder = {
  eventId: 1234,
  eventType: types.EventType.Order,
  tradeType: types.TradeType.Margin,
  orderType: types.OrderType.Limit,
  side: types.OrderSide.Buy,
  symbol: '6553',
  price: 2100,
  amount: 100
};

const testInit = async (done: () => void) => {

  trader = new WebTrader(order.symbol);
  await trader.init();
  assert(true);
  done();
}

const testMarginBuy = async (done: () => void) => {
  await trader.buy(order);
  done();
}

const testMarginSell = async (done: () => void) => {
  order.side = types.OrderSide.Sell;
  await trader.sell(order);
  done();
}

const testMarginCancel = async (done: () => void) => {
  const cancelOrder: types.Cancel = {
    eventType: types.EventType.Cancel,
    tradeType: types.TradeType.Margin,
    targetId: 123,
    eventId: 124
  };
  await trader.cancel(cancelOrder);
  trader.end();
  done();
}

describe('WebTrader测试', () => {
  it('测试初始化', function (done) {
    this.timeout(300000);
    testInit(done);
  });
  it('测试信用买入', function (done) {
    this.timeout(300000);
    testMarginBuy(done);
  });
  it('测试信用卖出', function (done) {
    this.timeout(300000);
    testMarginSell(done);
  });
  it('测试信用订单取消', function (done) {
    this.timeout(300000);
    testMarginCancel(done);
  });
});
