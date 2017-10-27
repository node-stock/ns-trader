import * as webdriverio from 'webdriverio';
import * as types from './types';
import * as numeral from 'numeral';
import * as moment from 'moment';
import { Log } from 'ns-common';
import * as util from 'util';

const acc = require('../../config/config').account;
const errUrl = 'https://www.rakuten-sec.co.jp/session_error.html';

export class WebDriver {
  symbol: string;
  client: webdriverio.Client<void>;
  autoRefresh: NodeJS.Timer;

  constructor(symbol: string) {
    this.symbol = symbol;
    this.client = webdriverio.remote({
      desiredCapabilities: {
        browserName: 'chrome'
      }
    });
  }

  async init() {
    Log.system.info('初期化WebDriver[启动]');
    await this.client.init();
    await this.login();
    this.autoRefresh = setInterval(() => {
      this.client.refresh();
    }, moment.duration(15, 'm').asMilliseconds());
    Log.system.info('初期化WebDriver[终了]');
    await this.toMargin();
  }

  /**
   * 登录乐天账户
   */
  async login() {
    Log.system.info('登录乐天账户[启动]');
    await this.client.url('https://www.rakuten-sec.co.jp/');
    await this.client.setValue('#form-login-id', acc.id);
    await this.client.setValue('#form-login-pass', acc.pass);
    await this.client.execute('document.getElementsByClassName("s1-form-login__btn")[0].click()');
    await this.client.waitForExist('#str-main-inner', 1000);
    // XXX　様のホームページ
    const res = await this.client.getText('.mbodyb');
    console.log(res);
    // 自動ログアウトoff
    await this.client.click('#changeAutoLogout');
    await this.client.alertAccept();
    Log.system.info('登录乐天账户[终了]');
  }

  async toMargin(symbol?: string, isChangeTab?: boolean) {
    Log.system.info('跳转信用交易界面[启动]');
    // 不为同页面tab切换时
    if (!isChangeTab) {
      await this.client.waitForExist('#gmenu_domestic_stock', 5000);
      // 国内株式
      await this.client.click('#gmenu_domestic_stock');
      // 買い注文(信用取引)
      await this.client.click('#ord2');
      await this.client.click('#jp-stk-top-btn-ord-mgn-new');
    } else {
      await this.client.execute('$("div.box-tab-search-01:eq(0) .first-child:eq(0)>a")[0].click()');
    }
    // 銘柄名･銘柄コード
    await this.client.setValue('#ss-02', symbol || this.symbol);
    // 検索
    await this.client.click('.img-ipad');
    const res = await this.client.isVisible('#autoUpdateButtonOn');

    // 股价自动更新未激活时，自动激活
    if (res) {
      await this.client.click('#autoUpdateButtonOn');
    }
    Log.system.info('跳转信用交易界面[终了]');
  }

  async toMarginSach() {
    await this.client.waitForExist('#gmenu_domestic_stock', 5000);
    // 国内株式
    await this.client.click('#gmenu_domestic_stock');
    // 注文
    await this.client.click('#nav-sub-menu-order-arrow');
    await this.client.click('span=信用取引');
    // 注文照会・訂正・取消
    await this.client.click('.nav-tab-01 li:nth-last-child(1)');
    // 「表示する」 检索
    await this.client.click('.ord_jp_req_search input[src="/member/images/btn-disp.png"]');
    // 取消
    await this.client.click('a=取消');
    await this.client.setValue('*[type="password"]', acc.otp);
    // 取消注文
    await this.client.click('#sbm');
    /*// 銘柄名･銘柄コード
    .setValue('#ss-02', opt.code)
    // 検索
    .click('.img-ipad')
    // 股价自动更新
    .click('#autoUpdateButtonOn');*/

  }

  async spotBuy(order: types.LimitOrder) {
    await this.client.waitForExist('#gmenu_domestic_stock', 5000);
    // 国内株式
    await this.client.click('#gmenu_domestic_stock');
    // 買い注文(現物)
    await this.client.click('#ord1').click('#jp-stk-top-btn-ord-spot-buy');
    // 銘柄名･銘柄コード
    await this.client.setValue('#ss-02', order.symbol);
    // 検索
    await this.client.click('.img-ipad');
    // 股价自动更新
    await this.client.click('#autoUpdateButtonOn');
    // 数量( 株/口)
    await this.client.setValue('#orderValue', order.amount);
    // 価格
    await this.client.setValue('#marketOrderPrice', order.price);
    await this.client.setValue('*[type="password"]', acc.otp);
    // 確認画面を省略する
    await this.client.click('#ormit_checkbox');
    // 注文
    await this.client.click('#ormit_sbm');
  }

  async marginBuy(order: types.LimitOrder) {
    Log.system.info(`信用买入[启动]: ${util.inspect(order, false, null)}`);
    // 売買区分->買建
    await this.client.click('.stockm #buy')
    await this.client.waitForExist('#mgnMaturityCd_system_6m', 5000);
    // 信用区分（期限）-> 制度（6ヶ月）
    await this.client.click('#mgnMaturityCd_system_6m');
    // 数量( 株/口)
    await this.client.setValue('#orderValue', order.amount);
    // 価格
    await this.client.setValue('#marketOrderPrice', order.price);
    await this.client.setValue('*[type="password"]', acc.otp);
    // 確認画面を省略する
    await this.client.click('#ormit_checkbox');
    // 注文
    await this.client.click('#ormit_sbm');
    Log.system.info(`信用买入[终了]`);
    // 返回信用界面
    await this.toMargin(order.symbol, true);
  }

  async marginSell(order: types.LimitOrder) {
    Log.system.info(`信用卖出[启动]: ${util.inspect(order, false, null)}`);
    // 返済注文(1:新規注文,2:返済注文,3:現引現渡注文,4:注文照会・訂正・取消)
    // 返済注文按钮
    await this.client.click('.nav-tab-01 li:nth-child(2)');
    await this.client.waitForExist('#special_table .tbl-data-01>tbody>tr:last-child img[src="/member/images/btn-repayment-02.gif"]', 5000);

    // 获取可卖股票名称
    const stockNames = await this.client.getText('#special_table .tbl-data-01>tbody>tr>td:nth-child(2)')
    // 股票索引
    let index = -1;
    if (Array.isArray(stockNames)) {
      stockNames.forEach((name, i) => {
        if (name.includes(order.symbol)) {
          index = i + 2;
        }
      });
    } else {
      if (stockNames.includes(order.symbol)) {
        // 去掉前两个tr
        index = 2;
      }
    }
    if (index === -1) {
      Log.system.info(`无可卖股票，取消执行，信用卖出[终了]`);
      // 返回信用界面
      await this.toMargin(order.symbol, true);
      return;
    }

    await this.client.click(`#special_table .tbl-data-01>tbody>tr:nth-child(${index}) img[src="/member/images/btn-repayment-02.gif"]`);
    // 等待返済注文页面的注文按钮出现
    await this.client.waitForExist('#ormit_sbm', 5000)
    const elements = await this.client.elements('input[name^="chkRepay"]');
    if (!elements.value) {
      Log.system.info(`无可卖股票，取消执行，信用卖出[终了]`);
      // 返回信用界面
      await this.toMargin(order.symbol, true);
      return;
    }
    // 获取已购买股票数量
    const len = elements.value.length;
    // 有短期持仓股票时
    if (len > acc.longLen) {
      // 获取卖单损益额
      const res = await this.client.getText('#form > table:nth-child(17) > tbody > tr:nth-child(1)' +
        ' > td:nth-child(1) > table > tbody > tr:last-child');
      const raw = res.split('\n');
      const [profit, buyDate] = [numeral(raw[5]).value(), raw[6]];
      Log.system.info('卖单损益额:', profit, '円');
      // 卖单损益额大于1000时运行卖单执行 并且建日为当天
      if (profit > 1000 && moment().format('YYYY/MM/DD') === buyDate) {

        // 选择最后一个持仓股票
        await this.client.click('#chkRepay' + (acc.longLen))
        // 価格（卖价减1）
        await this.client.setValue('#marketOrderPrice', order.price)
        await this.client.setValue('*[type="password"]', acc.otp)
        // 確認画面を省略する
        await this.client.click('#ormit_checkbox')
        // 注文
        await this.client.click('#ormit_sbm');
        Log.system.info(`信用卖出[终了]`);
      } else {
        Log.system.info(`卖单损益额：${profit},建日：${buyDate}`);
        Log.system.info(`取消执行，信用卖出[终了]`);
      }
    } else {
      Log.system.info(`已购买股票数量：${len},长线持有股票数量：${acc.longLen}，无短线卖单。`);
      Log.system.info(`取消执行，信用卖出[终了]`);
    }
    // 返回信用界面
    await this.toMargin(order.symbol, true);
  }

  // 信用订单取消
  async marginCancel(cancelOrder: types.Cancel) {
    Log.system.info(`信用订单取消[启动]: ${util.inspect(cancelOrder, false, null)}`);
    await this.client.click('.nav-tab-01 li:nth-child(4)')
    // 检索取消按钮图标
    const elements = await this.client.elements('img[src="/member/images/i_arrow_08.gif"]');
    if (!elements.value) {
      Log.system.info(`无可取消订单，信用订单取消[终了]`);
      // 返回信用界面
      await this.toMargin('', true);
      return;
    }
    await this.client.execute('$(".tbl-data-padding3 .mgn-order_list-font-size'
      + ' img[src=\'/member/images/i_arrow_08.gif\']:last~a")[0].click()') // 取消
    await this.client.setValue('*[type="password"]', acc.otp)
    // 取消注文
    await this.client.click('#sbm');
    Log.system.info(`信用订单取消[终了]`);
    // 返回信用界面
    await this.toMargin('', true);
  }

  async getTradeInfo() {
    const tradeInfo: { [Attr: string]: any } = {};
    // 价格
    tradeInfo.price = await this.client.getText('.price-01 nobr');
    // 信用余力
    tradeInfo.power = await this.client.getText('#auto_update_field_stock_price > tbody > tr > td:nth-child(1) >' +
      ' table:nth-child(7) > tbody > tr:nth-child(1) > td:nth-child(3) > div > nobr')
    // 単元株数
    tradeInfo.roundLot = await this.client.getText('#pricetable1 > tbody > tr:nth-child(4) > td > div > table > tbody >' +
      ' tr > td:nth-child(2) > div');
    // 买1 数量
    tradeInfo.askVol1 = await this.client.getText('#yori_table_update_ask_volume_1');
    // 买1 价格
    tradeInfo.ask1 = await this.client.getText('#yori_table_update_ask_1');
    // 卖1 数量
    tradeInfo.bidVol1 = await this.client.getText('#yori_table_update_bid_volume_1');
    // 卖1 价格
    tradeInfo.bid1 = await this.client.getText('#yori_table_update_bid_1');
    // 买盘总量
    tradeInfo.askOver = await this.client.getText('#yori_table_update_ask_volume_over');
    // 卖盘总量
    tradeInfo.bidUnder = await this.client.getText('#yori_table_update_bid_volume_under');
  }

  // 错误界面重新登录
  async errLogin() {
    const url = await this.client.getUrl();
    if (url === errUrl) {
      await this.client.setValue('#form-login-id', acc.id)
      await this.client.setValue('#form-login-pass', acc.pass)
      await this.client.click('.s1-form-login__btn');
    }
  }

  async end() {
    clearInterval(this.autoRefresh);
    await this.client.end();
  }
}
