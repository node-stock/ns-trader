import { WebDriver } from './webdriver';
import * as types from 'ns-types';
import * as assert from 'power-assert';

const config = require('config');

let wd: WebDriver;
const order: types.Order = {
  account_id: 'test',
  eventId: 1234,
  eventType: types.EventType.Order,
  symbolType: types.SymbolType.stock,
  tradeType: types.TradeType.Margin,
  orderType: types.OrderType.Limit,
  side: types.OrderSide.Buy,
  symbol: '6553',
  price: '2200',
  amount: '100',
  backtest: '1'
};

const testInit = async (done: () => void) => {

  wd = new WebDriver(config);
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
  await wd.end();
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
