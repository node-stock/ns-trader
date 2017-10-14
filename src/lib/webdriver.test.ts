import { WebDriver } from './webdriver';
import * as types from './types';
import * as assert from 'power-assert';

let wd: WebDriver;
const order: types.LimitOrder = {
  eventId: 1234,
  eventType: types.EventType.Order,
  tradeType: types.TradeType.Margin,
  orderType: types.OrderType.Limit,
  side: types.OrderSide.Buy,
  price: '2200',
  symbol: '6553',
  amount: '100'
};

const testInit = async (done: () => void) => {

  wd = new WebDriver('6553');
  await wd.init();
  assert(true);
  done();
}

const testMarginBuy = async (done: () => void) => {
  await wd.marginBuy(order);
  done();
}

const testMarginSell = async (done: () => void) => {
  order.side = types.OrderSide.Sell;
  await wd.marginSell(order);
  done();
}

const testMarginCancel = async (done: () => void) => {
  const cancelOrder: types.Cancel = {
    eventType: types.EventType.Cancel,
    tradeType: types.TradeType.Margin,
    targetId: 123,
    eventId: 124
  };
  await wd.marginCancel(cancelOrder);
  wd.end();
  done();
}

describe('WebDriver测试', () => {
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
