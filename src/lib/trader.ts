import { WebDriver } from './webdriver';
import * as types from './types';
import { Log } from 'ns-common';

class Trader {

  constructor() { }

  buy(order: types.Order) { }

  sell(order: types.Order) { }

  cancel(order: types.Cancel) { }
}

class WebTrader extends Trader {

  symbol: string;
  webDriver: WebDriver;

  constructor(symbol: string = '6553') {
    super();
    this.symbol = symbol;
    this.webDriver = new WebDriver(symbol);
  }

  async init() {
    await this.webDriver.init();
  }

  buy(order: types.Order) {
    // 信用交易
    if (order.tradeType === types.TradeType.Margin) {
      this.webDriver.marginBuy(<types.LimitOrder>order).catch((e: Error) => {
        Log.system.error(`买入多单失败：${e.stack}`);
      });
    }
  }

  sell(order: types.Order) {
    Log.system.info(`卖出多单: ${order}`);
    // 信用交易
    if (order.tradeType === types.TradeType.Margin) {
      this.webDriver.marginSell(<types.LimitOrder>order).catch((e: Error) => {
        Log.system.error(`卖出单失败：${e.stack}`);
      });
    }
  }

  cancel(cancelOrder: types.Cancel) {
    Log.system.info(`撤销订单: ${cancelOrder}`);
    // 信用交易
    if (cancelOrder.tradeType === types.TradeType.Margin) {
      this.webDriver.marginCancel(cancelOrder).catch((e: Error) => {
        Log.system.error(`撤销订单失败：${e.stack}`);
      });
    }
  }

  end() {
    this.webDriver.end();
  }
}
