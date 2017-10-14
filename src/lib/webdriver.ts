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
    await this.toMargin();
    this.autoRefresh = setInterval(() => {
      this.client.refresh();
    }, moment.duration(15, 'm').asMilliseconds());
    Log.system.info('初期化WebDriver[终了]');
  }

  /**
   * 登录乐天账户
   */
  async login() {
    Log.system.info('登录乐天账户[启动]');
    const client = await this.client
      .url('https://www.rakuten-sec.co.jp/')
      .setValue('#form-login-id', acc.id)
      .setValue('#form-login-pass', acc.pass)
      .isVisible('.s1-form-login__btn').then(res => console.log('.s1-form-login__btn:', res))
      .click('.s1-form-login__btn')
      .waitForExist('#str-main-inner', 1000)
      // XXX　様のホームページ
      .getText('.mbodyb').then((res: string) => {
        console.log(res);
      }).pause(500)
      // 自動ログアウトoff
      .click('#changeAutoLogout').pause(500)
      .alertAccept();
    Log.system.info('登录乐天账户[终了]');
    return client;
  }

  async toMargin(symbol?: string, isChangeTab?: boolean) {
    Log.system.info('跳转信用交易界面[启动]');
    // 不为同页面tab切换时
    if (!isChangeTab) {
      await this.client.waitForExist('#gmenu_domestic_stock', 5000)
        // 国内株式
        .click('#gmenu_domestic_stock')
        // 買い注文(信用取引)
        .click('#ord2').click('#jp-stk-top-btn-ord-mgn-new')
    } else {
      await this.client.click('#str-main-inner > table > tbody > tr > td > form' +
        ' > div.box-tab-search-01 > div > ul > li.first-child.active > a')
    }
    // 銘柄名･銘柄コード
    await this.client.setValue('#ss-02', symbol || this.symbol)
      // 検索
      .click('.img-ipad')
      .isVisible('#autoUpdateButtonOn').then(res => {
        // 股价自动更新未激活时，自动激活
        if (res) {
          this.client.click('#autoUpdateButtonOn');
        }
      });
    Log.system.info('跳转信用交易界面[终了]');
  }

  toMarginSach() {
    return this.client.waitForExist('#gmenu_domestic_stock', 5000)
      .click('#gmenu_domestic_stock') // 国内株式
      // 注文
      .click('#nav-sub-menu-order-arrow')
      .click('span=信用取引')
      // 注文照会・訂正・取消
      .click('.nav-tab-01 li:nth-last-child(1)')
      // 「表示する」 检索
      .click('.ord_jp_req_search input[src="/member/images/btn-disp.png"]')
      // 取消
      .click('a=取消')
      .setValue('*[type="password"]', acc.otp)
      // 取消注文
      .click('#sbm')
    /*// 銘柄名･銘柄コード
    .setValue('#ss-02', opt.code)
    // 検索
    .click('.img-ipad')
    // 股价自动更新
    .click('#autoUpdateButtonOn');*/

  }

  spotBuy(order: types.LimitOrder) {
    return this.client.waitForExist('#gmenu_domestic_stock', 5000)
      // 国内株式
      .click('#gmenu_domestic_stock')
      // 買い注文(現物)
      .click('#ord1').click('#jp-stk-top-btn-ord-spot-buy')
      // 銘柄名･銘柄コード
      .setValue('#ss-02', order.symbol)
      // 検索
      .click('.img-ipad')
      // 股价自动更新
      .click('#autoUpdateButtonOn')
      // 数量( 株/口)
      .setValue('#orderValue', order.amount)
      // 価格
      .setValue('#marketOrderPrice', order.price)
      .setValue('*[type="password"]', acc.otp)
      // 確認画面を省略する
      .click('#ormit_checkbox')
      // 注文
      .click('#ormit_sbm');
  }

  async marginBuy(order: types.LimitOrder) {
    Log.system.info(`信用买入[启动]: ${util.inspect(order, false, null)}`);
    await this.client.click('.stockm #buy') // // 売買区分->買建
      .waitForExist('#mgnMaturityCd_system_6m', 5000)
      // 信用区分（期限）-> 制度（6ヶ月）
      .click('#mgnMaturityCd_system_6m')
      // 数量( 株/口)
      .setValue('#orderValue', order.amount)
      // 価格
      .setValue('#marketOrderPrice', order.price)
      .setValue('*[type="password"]', acc.otp)
      // 確認画面を省略する
      .click('#ormit_checkbox')
      // 注文
      .click('#ormit_sbm');
    Log.system.info(`信用买入[终了]`);
    // 返回信用界面
    return this.toMargin(order.symbol, true);
  }

  async marginSell(order: types.LimitOrder) {
    Log.system.info(`信用卖出[启动]: ${util.inspect(order, false, null)}`);
    // 返済注文(1:新規注文,2:返済注文,3:現引現渡注文,4:注文照会・訂正・取消)
    // 返済注文按钮
    const elements = await this.client.click('.nav-tab-01 li:nth-child(2)')
      .click('#special_table .tbl-data-01>tbody>tr:last-child img[src="/member/images/btn-repayment-02.gif"]')
      .elements('input[name^="chkRepay"]');
    if (!elements.value) {
      Log.system.info(`无可卖股票，取消执行，信用卖出[终了]`);
      // 返回信用界面
      return this.toMargin(order.symbol, true);
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
          .setValue('#marketOrderPrice', order.price)
          .setValue('*[type="password"]', acc.otp)
          // 確認画面を省略する
          .click('#ormit_checkbox')
          // 注文
          .click('#ormit_sbm');
        Log.system.info(`信用卖出[终了]`);
      } else {
        Log.system.info(`卖单损益额：${profit},建日：${buyDate}`);
        Log.system.info(`取消执行，信用卖出[终了]`);
      }
    } else {
      Log.system.info(`无短线卖单，取消执行，信用卖出[终了]`);
    }
    // 返回信用界面
    return this.toMargin(order.symbol, true);
  }

  // 信用订单取消
  async marginCancel(cancelOrder: types.Cancel) {
    Log.system.info(`信用订单取消[启动]: ${util.inspect(cancelOrder, false, null)}`);
    const elements = await this.client.click('.nav-tab-01 li:nth-child(4)')
      .click('#special_table .tbl-data-01>tbody>tr:last-child img[src="/member/images/btn-repayment-02.gif"]')
      .elements('input[name^="chkRepay"]');
    if (!elements.value) {
      Log.system.info(`无可取消订单，信用订单取消[终了]`);
      // 返回信用界面
      return this.toMargin('', true);
    }
    await this.client.click('a=取消') // 取消
      .setValue('*[type="password"]', acc.otp)
      // 取消注文
      .click('#sbm');
    Log.system.info(`信用订单取消[终了]`);
    // 返回信用界面
    return this.toMargin('', true);
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
      return this.client
        .setValue('#form-login-id', acc.id)
        .setValue('#form-login-pass', acc.pass)
        .click('.s1-form-login__btn');
    }
  }

  end() {
    clearInterval(this.autoRefresh);
    this.client.end();
  }
}