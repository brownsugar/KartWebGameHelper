/* Warning: this file is for testing only. */

const kwghTemplate = `
<div id="kwgh" class="kwgh-wrap kwgh-korea-2019-0425">
  <nav class="border fixed split-nav">
    <div class="nav-brand">
      <h3><label for="collapsible-kwgh-dialog"><a>Get started</a></label></h3>
    </div>
    <div class="collapsible">
      <input id="kwgh-collapsible-menu" type="checkbox" name="kwgh-collapsible-menu" />
      <button>
        <label for="kwgh-collapsible-menu">
          <div class="bar1"></div>
          <div class="bar2"></div>
          <div class="bar3"></div>
        </label>
      </button>
      <div class="collapsible-body">
        <ul class="inline">
          <li><label for="kwgh-modal-about"><a>About KartWebGameHelper</a></label></li>
          <li><a href="https://github.com/brownsugar/KartWebGameHelper" target="_blank">GitHub</a></li>
        </ul>
      </div>
    </div>
  </nav>
  <div class="kwgh-dialog">
    <div class="collapsible">
      <input id="collapsible-kwgh-dialog" type="checkbox" name="collapsible-kwgh-dialog" />
      <div class="collapsible-body">
        <div class="collapsible-content border border-4 border-primary">
          <div class="tabs">
            <input type="radio" name="kwgh-tabs" id="tab1" checked />
            <label for="tab1">Config</label>
            <input type="radio" name="kwgh-tabs" id="tab2" />
            <label for="tab2">Item & Coupon</label>
            <input type="radio" name="kwgh-tabs" id="tab3" />
            <label for="tab3">Coupon Only</label>
            <input type="radio" name="kwgh-tabs" id="tab4" />
            <label for="tab4">Coupon Group</label>
            <div id="content1" class="content">
              <div class="form-group">
                <label class="paper-check">
                  <input type="checkbox" name="kwgh-autoRun" value="1" checked /> <span>Auto run (use all)</span>
                </label>
              </div>
              <div class="form-group">
                <label class="paper-check">
                  <input type="checkbox" name="kwgh-ignoreError" value="1" checked /> <span>Ignore error</span>
                </label>
              </div>
              <div class="form-group">
                <button class="btn-secondary" onclick="doMarble()">Let's GO!</button>
                <button class="btn-secondary" onclick="doComplete()">Complete</button>
              </div>
            </div>
            <div id="content2" class="content kwgh-coupon-list">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Item</th>
                    <th>Coupon</th>
                  </tr>
                </thead>
                <tbody>
                  <!--<tr>
                    <td>1</td>
                    <td>네오의 신상 카트 No.6</td>
                    <td><input class="coupon" type="text" value="24868-35040-73433-55804-18438" readonly /></td>
                  </tr>
                  <tr>
                    <td>2</td>
                    <td>코인</td>
                    <td><input class="coupon" type="text" value="24868-35040-73433-55804-18438" readonly /></td>
                  </tr>
                  <tr>
                    <td>3</td>
                    <td>골드 플랜트 상자</td>
                    <td><input class="coupon" type="text" value="24868-35040-73433-55804-18438" readonly /></td>
                  </tr>-->
                </tbody>
              </table>
            </div>
            <div id="content3" class="content kwgh-coupon-sn">
              <div class="form-group">
                <textarea class="no-resize fix-height" placeholder="Nothing yet."></textarea>
              </div>
            </div>
            <div id="content4" class="content kwgh-coupon-group">
              <!--<div class="form-group">
                <label>네오의 신상 카트 No.6</label>
                <textarea class="no-resize" placeholder="Nothing yet.">24868-35040-73433-55804-18438\n24868-35040-73433-55804-18438\n24868-35040-73433-55804-18438\n24868-35040-73433-55804-18438\n24868-35040-73433-55804-18438\n24868-35040-73433-55804-18438</textarea>
              </div>
              <div class="form-group">
                <label>코인</label>
                <textarea class="no-resize" placeholder="Nothing yet.">24868-35040-73433-55804-18438\n24868-35040-73433-55804-18438</textarea>
              </div>
              <div class="form-group">
                <label>골드 플랜트 상자</label>
                <textarea class="no-resize" placeholder="Nothing yet.">24868-35040-73433-55804-18438\n24868-35040-73433-55804-18438</textarea>
              </div>-->
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="kwgh-modal">
    <input id="kwgh-modal-about" class="modal-state" type="checkbox" />
    <div class="modal">
      <label class="modal-bg" for="kwgh-modal-about"></label>
      <div class="modal-body">
        <label class="btn-close" for="kwgh-modal-about">X</label>
        <h4 class="modal-title">KartWebGameHelper v0.1</h4>
        <h5 class="modal-subtitle">Just an assistant for KartRider web-based games.</h5>
        <ul>
          <li>Released on 2019/05/06.</li>
          <li>Developed by <span><a href="https://brownsugar.tw" target="_blank">Brownsugar</a>.</li>
          <li>Published on <a href="https://kartinfo.me" target="_blank">KartInfo</a>.</li>
          <li>You can see more details <a href="https://kartinfo.me" target="_blank">here</a>.</li>
          <li>Awesome theme by <a href="https://github.com/papercss/papercss" target="_blank">PaperCSS</a>.</li>
        </ul>
      </div>
    </div>
  </div>
</div>
`
document.getElementsByTagName('body')[0].insertAdjacentHTML('beforeend', kwghTemplate)

window.coupons = {}

// save to localstorage
function doMarble() {
  doRun().then(data => {
    console.log(data)
    PositionCur = data.n1Position

    if (!data.strCouponSN)
      return

    const coupon = {
      id: data.n4ItemNo,
      name: data.strItemName,
      sn: data.strCouponSN
    }
    // remain: data.n4CoinNowCnt
    // round: data.n4CompleteCnt

    if (!window.coupons[data.n4ItemNo]) {
      window.coupons[data.n4ItemNo] = []
    }
    window.coupons[data.n4ItemNo].push(coupon)
    parseCoupon(coupon)
  })
}
function parseCoupon(coupon) {
  $('.kwgh-coupon-list tbody').append(`<tr><td>${$('.kwgh-coupon-list tbody tr').length + 1}</td><td>${coupon.name}</td><td><input class="coupon" type="text" value="${coupon.sn}" onclick="select()" readonly /></td></tr>`)
  $('.kwgh-coupon-sn textarea').val($('.kwgh-coupon-sn textarea').val() + coupon.sn + '\n')

  let html = ''
  Object.keys(window.coupons).forEach(id => {
    const name = window.coupons[id][0].name
    let sns = ''
    window.coupons[id].forEach(cp => {
      sns += cp.sn + '\n'
    })
    html += `<div class="form-group"><label>${name}</label><textarea class="no-resize" placeholder="Nothing yet.">${sns}</textarea></div>`
  })
  $('.kwgh-coupon-group').html(html)
}
function parseCoupons() {
  // window.coupons.forEach(coupon => {
  // })
}
function doRun() {
  return new Promise((resolve, reject) => {
    $.ajax({
      type: 'POST',
      url: 'Ajax.aspx',
      data: {
        strType: 'apply',
        PositionCur: PositionCur,
        rd: Math.random()
      },
      dataType: 'json',
      cache: false,
      success: function(data) {
        if (data != null && data.Return != null) {
          if (data.Return.n4Return == 0 && data.Data != null && data.Data.length > 0) {
            resolve(data.Data[0])
          }
          else {
            if (data.Return.n4Return <= 0 && data.Return.strReturnValue != null && data.Return.strReturnValue.length > 0) {
              reject(data.Return.strReturnValue) // game error
            }
            else {
              reject('Error 1.')
            }
          }
        }
        else {
          reject('Error 9.')
        }
      },
      error: function(data, status, err) {
        reject(data, status, err) // server error
      }
    })
  })
}


function doComplete() {
  // {
  //    "Return":{
  //       "n4Return":0,
  //       "strReturnValue":""
  //    },
  //    "Data":{
  //       "n4CompleteCnt":39,
  //       "n4CompleteItemGetCnt":15,
  //       "n4ItemNo":1953,
  //       "n4ReturnValue":0,
  //       "strCouponSN":"46502-89392-61662-83978-93330",
  //       "strItemName":"플라잉 백박쥐",
  //       "strCreate":"2019-05-08 23:54",
  //       "SPReturnValue":0,
  //       "SPErrorCode":0,
  //       "SPErrorMessage":""
  //    }
  // }
}