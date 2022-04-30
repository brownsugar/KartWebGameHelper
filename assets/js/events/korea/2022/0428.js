(() => {
  const EVENT_KEY = 'kwgh-korea-2022-0428'
  const playCoinConsume = 2
  const requestInterval = 600
  let isBusy = false

  kwgh.init({
    eventKey: EVENT_KEY,
    date: '2022/05/01',
    play,
    load
  })
  kwgh.addCoupons(kwgh.coupons)

  const remainCoinEl = kwgh.el.q('#EventCoin')
  const useCoinEl = kwgh.el.q('#WebUseCoin')
  const totalCoinEl = kwgh.el.q('#TotalCoin')
  kwgh.ev(EVENT_KEY, 'jewelry', 'count', Number(totalCoinEl.innerText.replace(/[,|\.]/g, '')))

  let getCount
  function play() {
    if (isBusy) {
      isBusy = false
      return
    }
    isBusy = true
    kwgh.loading()
    kwgh.ev(EVENT_KEY, 'play', 'click')
    if (kwgh.config.autoRun !== false) {
      kwgh.btnLoading('#kwgh-btn-play', 'STOP', false)
      kwgh.ev(EVENT_KEY, 'play', 'autoRun', 1)
    }
    else {
      kwgh.btnLoading('#kwgh-btn-play', 'Working...')
      kwgh.ev(EVENT_KEY, 'play', 'autoRun', 0)
    }

    getCount = 0
    doPlay()
  }
  function doPlay() {
    let error = false

    playRequest().then(data => {
      // {
      //   "returnCode": 0,
      //   "returnMsg": "",
      //   "ItemList": [
      //     {
      //       "itemIndex": 9,
      //       "itemNo": 2439,
      //       "itemName": "세이버 V1 (10일)"
      //     }
      //   ],
      //   "CouponNo": "00000-00000-00000-00000-00000",
      //   "InGameCoin": 510,
      //   "WebUseCoin": 2,
      //   "EventCoin": 508
      // }

      const item = data.ItemList[0]

      // Change page data
      remainCoin = data.EventCoin
      remainCoinEl.innerHTML = remainCoin.toLocaleString()
      const useCoin = data.WebUseCoin
      useCoinEl.innerHTML = useCoin.toLocaleString()
      const totalCoin = data.InGameCoin
      totalCoinEl.innerHTML = totalCoin.toLocaleString()

      const coupon = {
        id: item.itemNo,
        name: item.itemName,
        sn: data.CouponNo
      }
      kwgh.setCoupon(coupon)
      getCount++

      if(kwgh.config.autoRun === false) {
        kwgh.toast('secondary', `Got item: ${coupon.name}.`)
      }
    }).catch(message => {
      error = true
      kwgh.message('error', message)
    }).finally(() => {
      if (!isBusy || error && !kwgh.config.ignoreError || kwgh.config.autoRun === false || kwgh.config.autoRun !== false && remainCoin < playCoinConsume) {
        isBusy = false
        kwgh.loading(false)
        kwgh.btnLoading('#kwgh-btn-play', false)
        if (kwgh.config.autoRun === false || error) {
          return
        }
        kwgh.message('success', `Working end. Got ${getCount} items.`)
        kwgh.ev(EVENT_KEY, 'play', 'getCount', getCount)
      }
      else {
        setTimeout(() => {
          doPlay()
        }, requestInterval)
      }
    })
  }
  function playRequest() {
    return new Promise((resolve, reject) => {
      kwgh.ajax.post('AjaxEvent.aspx', {
        success: result => {
          if (result != null) {
            if (result.returnCode == 0 && Array.isArray(result.ItemList) && result.ItemList.length) {
              resolve(result)
            }
            else if (result.returnMsg) {
              return reject(result.returnMsg)
            }
            else {
              return reject('Unknown error.')
            }
          }
          else {
            return reject('Unknown error.')
          }
        }
      })
    })
  }

  let loadCount
  function load() {
    if (isBusy) {
      return
    }
    isBusy = true
    kwgh.loading()
    kwgh.btnLoading('#kwgh-btn-load')
    kwgh.ev(EVENT_KEY, 'load', 'click')

    loadCount = 0
    doLoad()
  }

  function doLoad(page = 1) {
    loadRequest(page).then(({ totalPage = 1, couponList = [] }) => {
      couponList.forEach(data => {
        const coupon = {
          id: data.itemNo,
          name: data.itemName,
          sn: data.coupon
        }
        kwgh.setCoupon(coupon)
        loadCount++
      })
      if (page < totalPage) {
        setTimeout(() => {
          doLoad(++page)
        }, requestInterval)
      }
      else {
        kwgh.message('success', `${loadCount} coupons have been loaded.`)
        isBusy = false
        kwgh.loading(false)
        kwgh.btnLoading('#kwgh-btn-load', false)
        kwgh.ev(EVENT_KEY, 'load', 'totalItem', loadCount)
      }
    }).catch(message => {
      kwgh.message('error', message)
      isBusy = false
      kwgh.loading(false)
      kwgh.btnLoading('#kwgh-btn-load', false)
    })
  }
  function loadRequest(page) {
    return new Promise((resolve, reject) => {
      // <script type="text/javascript">
      //   Event220428.LayerAlert("<span class='pt_c1'>로그인 후</span> 확인해 주세요.");
      // </script>
      // OR
      // <ul class="item_data_list">
      //   <li>
      //     <dl class="coupon">
      //       <dt class="blind">아이템 이미지</dt>
      //       <dd class="tmb">
      //         <span class="item i2439">세이버 V1 (10일)</span>
      //       </dd>
      //       <dt class="blind">당첨일</dt>
      //       <dd class="date">2022-05-01 03:49</dd>
      //       <dt class="blind">아이템</dt>
      //       <dd class="name">세이버 V1 (10일)</dd>
      //       <dt class="blind">유효기간</dt>
      //       <dd class="validity">2022-05-25 23:59</dd>
      //       <dt class="blind">쿠폰번호</dt>
      //       <dd class="key">00000-00000-00000-00000-00000</dd>
      //     </dl>
      //   </li>
      // </ul>
      // <div class="pager">
      //   <button type="button" class="btn btn_fr " onclick="Event220428.CouponListDate(1)">처음</button>
      //   <button type="button" class="btn btn_pv disabled" onclick="return false;">이전</button>
      //   <span>
      //     <a href="javascript:void(0);" onclick="Event220428.CouponListDate(1)">1</a><strong>2</strong>
      //   </span>
      //   <button type="button" class="btn btn_nx disabled" onclick="return false;">다음</button>
      //   <button type="button" class="btn btn_ls disabled" onclick="return false;">마지막</button>
      // </div>
      kwgh.ajax.post('MyCouponList.aspx', {
        data: {
          n4Page: page
        },
        dataType: 'html',
        success: result => {
          if (result != null) {
            const loadErrorRegex = /LayerAlert\(\"(.+)\"\);/i
            if (loadErrorRegex.test(result)) {
              const [, msg] = result.match(loadErrorRegex)
              return reject(msg)
            }
            if (/class=\"item_data_list\"/i.test(result)) {
              const itemInfoRegex = /class="item i(\d+)">([^<]+)<\//ig
              const couponRegex = /class="key">([^<]+)<\//ig
              let snData = []
              let match
              while ((match = itemInfoRegex.exec(result)) !== null) {
                const coupon = couponRegex.exec(result)
                snData.push({
                  itemNo: match[1],
                  itemName: match[2],
                  coupon: coupon[1]
                })
              }
              const lastPageRegex = /onclick=\"Event220428.CouponListDate\((\d+)\)\">마지막/i
              const totalPage = lastPageRegex.test(result) ? result.match(lastPageRegex)[1] : 1
              return resolve({
                totalPage: Number(totalPage),
                couponList: snData
              })
            }
            return reject('No coupon found.')
          }
          return reject('Unknown error.')
        },
        error: (request, status, error) => {
          return reject(`Network error.\nstatus: ${request.status}\nerror: ${error}`)
        }
      })
    })
  }
})()