import { WebDriver } from './webdriver';
import * as types from './types';
import { Log } from 'ns-common';

export class Trader {
  protected symbol: string;

  constructor(symbol: string) {
    this.symbol = symbol;
  }

  buy(order: types.Order) { }

  sell(order: types.Order) { }

  cancel(order: types.Cancel) { }
}

export class WebTrader extends Trader {
  webDriver: WebDriver;

  constructor(symbol: string = '6553') {
    super(symbol);
    this.webDriver = new WebDriver(this.symbol);
  }

  async init() {
    try {
      Log.system.info('初期化WebTrader[启动]');
      await this.webDriver.init();
      Log.system.info('初期化WebTrader[终了]');
    } catch (err) {
      Log.system.error(`初期化WebTrader[异常]：${err.stack}`);
    }
  }

  async buy(order: types.Order) {
    try {
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

  async end() {
    try {
      Log.system.info('关闭WebTrader[启动]');
      await this.webDriver.end();
      Log.system.info('关闭WebTrader[终了]');
    } catch (err) {
      Log.system.error(`关闭WebTrader[异常]：${err.stack}`);
    }
  }
}
