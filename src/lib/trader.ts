import { WebDriver } from './webdriver';
import * as types from 'ns-types';
import { Log } from 'ns-common';
import * as assert from 'power-assert';

export class Trader {
  order: types.BaseOrder;
  protected config: { [Attr: string]: any };

  constructor(config: { [Attr: string]: any }) {
    assert(config, 'config required.');
    assert(config.trader, 'config.trader required.');
    assert(config.account, 'config.account required.');
    this.config = config;
    this.order = <types.Order>{
      eventType: types.EventType.Order,
      tradeType: types.TradeType.Margin,
      orderType: types.OrderType.Limit,
      side: types.OrderSide.Buy,
      symbol: this.config.trader.symbol,
      amount: '100'
    }
  }

  buy(order: types.Order) { }

  sell(order: types.Order) { }

  cancel(order: types.Cancel) { }
}

export class WebTrader extends Trader {
  webDriver: WebDriver;

  constructor(config: { [Attr: string]: any }) {
    super(config);
    if (!this.config.trader.test) {
      this.webDriver = new WebDriver(this.config);
    }
  }

  async init() {
    try {
      if (this.config.trader.test) {
        Log.system.info('测试模式，不执行WebTrader初期化');
        return;
      }
      Log.system.info('初期化WebTrader[启动]');
      await this.webDriver.init();
      Log.system.info('初期化WebTrader[终了]');
    } catch (err) {
      Log.system.error(`初期化WebTrader[异常]：${err.stack}`);
    }
  }

  async buy(order: types.Order) {
    try {
      if (this.config.trader.test) {
        Log.system.info('测试模式，不执行WebTrader买入', order);
        return;
      }
      Log.system.info('执行买入[启动]');
      // 信用交易
      if (order.tradeType === types.TradeType.Margin) {
        await this.webDriver.marginBuy(<types.LimitOrder>order);
      }
      Log.system.info('执行买入[终了]');
    } catch (err) {
      Log.system.error(`执行买入[异常]：${err.stack}`);
    }
  }

  async sell(order: types.Order) {
    try {
      if (this.config.trader.test) {
        Log.system.info('测试模式，不执行WebTrader卖出', order);
        return;
      }
      Log.system.info('执行卖出[启动]');
      // 信用交易
      if (order.tradeType === types.TradeType.Margin) {
        await this.webDriver.marginSell(<types.LimitOrder>order);
      }
      Log.system.info('执行卖出[终了]');
    } catch (err) {
      Log.system.error(`执行卖出[异常]：${err.stack}`);
    }
  }

  async cancel(cancelOrder: types.Cancel) {
    try {
      if (this.config.trader.test) {
        Log.system.info('测试模式，不执行WebTrader撤单', cancelOrder);
        return;
      }
      Log.system.info('执行撤单[启动]');
      // 信用交易
      if (cancelOrder.tradeType === types.TradeType.Margin) {
        await this.webDriver.marginCancel(cancelOrder);
      }
      Log.system.info('执行撤单[终了]');
    } catch (err) {
      Log.system.error(`执行撤单[异常]：${err.stack}`);
    }
  }

  async getTradeInfo() {
    if (!this.config.trader.test) {
      return await this.webDriver.getTradeInfo();
    }
  }

  async end() {
    try {
      if (this.config.trader.test) {
        Log.system.info('测试模式，不执行关闭WebTrader');
        return;
      }
      Log.system.info('关闭WebTrader[启动]');
      await this.webDriver.end();
      Log.system.info('关闭WebTrader[终了]');
    } catch (err) {
      Log.system.error(`关闭WebTrader[异常]：${err.stack}`);
    }
  }
}
