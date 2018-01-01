import { WebTrader } from './trader';
import * as types from 'ns-types';
import * as assert from 'power-assert';

const config = require('config');
const trader = new WebTrader(config);

const testInit = async (done: () => void) => {

  await trader.init();
  assert(true);
  done();
}

const testMarginBuy = async (done: () => void) => {
  trader.order.price = '2100';
  await trader.buy(<types.LimitOrder>Object.assign(trader.order, {
    side: types.OrderSide.Buy,
    price: 2100
  }));
  done();
}

const testMarginSell = async (done: () => void) => {
  await trader.sell(<types.LimitOrder>Object.assign(trader.order, {
    side: types.OrderSide.Sell,
    price: 2100
  }));
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
