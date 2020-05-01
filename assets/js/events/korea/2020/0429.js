(() => {
  const EVENT_KEY = 'kwgh-korea-2020-0429'
  const playCoinConsume = 2
  const requestInterval = 600
  let isBusy = false

  kwgh.init({
    eventKey: EVENT_KEY,
    date: '2020/05/02',
    play: play,
    load: load
  })
  kwgh.addCoupons(kwgh.coupons)
  kwgh.ev(EVENT_KEY, 'jewelry', 'count', parseInt(kwgh.el.q('#InGameCoin').innerText))

  const remainCoinEl = kwgh.el.q('#EventCoin')
  const finishRoundEl = kwgh.el.q('#WebUseCoin')
  const playErrorRegex = /Event200429Apply\(obj\) {\s+layerAlert\(\"(.+)\"\);/i
  const loadErrorRegex = /layerAlert\(\"(.+)\"\);/i
  let remainCoin = Number(remainCoinEl.innerText)

  let getCount
  function play() {
    if (isBusy) {
      isBusy = false
      return
    }
    isBusy = true
    kwgh.loading()
    kwgh.ev(EVENT_KEY, 'play', 'click')
    if (kwgh.config.autoRun) {
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
      // Change page data
      remainCoin = data.EventCoin
      remainCoinEl.innerText = remainCoin
      finishRoundEl.innerText = (data.WebUseCoin || 0) / 2

      if (!data.CouponNo)
        return

      const item = data.ItemList.find(item => item.cardselected === 1)
      const coupon = {
        id: item.itemIndex,
        name: item.itemName,
        sn: data.CouponNo
      }
      kwgh.setCoupon(coupon)
      getCount++

      if(!kwgh.config.autoRun) {
        kwgh.toast('secondary', `Got item: ${coupon.name}.`)
      }
    }).catch(message => {
      error = true
      kwgh.message('error', message)
    }).finally(() => {
      if (!isBusy || error && !kwgh.config.ignoreError || !kwgh.config.autoRun || kwgh.config.autoRun && remainCoin < playCoinConsume) {
        isBusy = false
        kwgh.loading(false)
        kwgh.btnLoading('#kwgh-btn-play', false)
        if (!kwgh.config.autoRun || error) {
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
      if (playErrorRegex.test(document.documentElement.innerHTML)) {
        const [, msg] = document.documentElement.innerHTML.match(playErrorRegex)
        return reject(msg)
      }
      if (remainCoin < playCoinConsume) {
        return reject('Jewelry not enough.')
      }

      // {
      //   "returnCode": 0,
      //   "returnMsg": "",
      //   "ItemList": [
      //     {
      //       "cardid": 1,
      //       "cardselected": 0,
      //       "itemIndex": 21,
      //       "itemName": "슬롯 체인저 (50개)"
      //     },
      //     {
      //       "cardid": 2
      //     },
      //     {
      //       "cardid": 3
      //     },
      //     {
      //       "cardid": 4
      //     },
      //     {
      //       "cardid": 5
      //     },
      //     {
      //       "cardid": 6
      //     },
      //     {
      //       "cardid": 7
      //     },
      //     {
      //       "cardid": 8
      //     }
      //   ],
      //   "CouponNo": "00000-00000-00000-00000-00000",
      //   "InGameCoin": 237,
      //   "WebUseCoin": 4,
      //   "EventCoin": 233
      // }
      kwgh.ajax.post('Apply.aspx', {
        data: {
          CardID: 1,
          rd: Math.random()
        },
        success: result => {
          if (result != null) {
            if (result.returnCode == 0) {
              return resolve(result)
            } else if (result.returnCode <= 0 && !!result.returnMsg) {
              return reject(result.returnMsg)
            }
          }
          return reject('Unknown error.')
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
      // WTF AGAIN
      // <script type="text/javascript">
      //    layerAlert("로그인 후 이용해주세요.");
      // </script>
      // OR
      // <ul class="item_data_list">
      //   <li>
      //     <dl class="coupon">
      //       <dt class="blind">아이템 이미지</dt>
      //       <dd class="tmb">
      //         <span class="item12">치즈 X (무제한)</span>
      //       </dd>
      //       <dt class="blind">당첨일</dt>
      //       <dd class="date">2020-05-02 01:56</dd>
      //       <dt class="blind">아이템</dt>
      //       <dd class="name">치즈 X (무제한)</dd>
      //       <dt class="blind">유효기간</dt>
      //       <dd class="validity">2020-06-03 23:59</dd>
      //       <dt class="blind">쿠폰번호</dt>
      //       <dd class="key">00000-00000-00000-00000-00000</dd>
      //     </dl>
      //   </li>
      // </ul>
      // <div class="pager">
      //   <button type="button" class="btn btn_first" onclick="return false;">처음</button>
      //   <button type="button" class="btn btn_prev" onclick="return false;">이전</button>
      //   <span>
      //     <strong title="현재 페이지">1</strong>
      //   </span>
      //   <button type="button" class="btn btn_next" onclick="return false;">다음</button>
      //   <button type="button" class="btn btn_last" onclick="return false;">마지막</button>
      // </div>
      kwgh.ajax.post('MyCouponList.aspx', {
        data: {
          n4Page: page
        },
        dataType: 'html',
        success: result => {
          if (result != null) {
            if (loadErrorRegex.test(result)) {
              const [, msg] = result.match(loadErrorRegex)
              return reject(msg)
            }
            if (/class=\"item_data_list\"/i.test(result)) {
              const itemRegex = /<span class="item(\d+)">([^<]+)<\/span>/ig
              const couponRegex = /<dd class="key">([^<]+)<\/dd>/ig
              let snData = []
              let match
              while ((match = itemRegex.exec(result)) !== null) {
                const coupon = couponRegex.exec(result)
                snData.push({
                  itemNo: match[1],
                  itemName: match[2],
                  coupon: coupon[1]
                })
              }
              const lastPageRegex = /onclick=\"CouponListDate\((\d+)\)\">마지막<\/button>/i
              const totalPage = lastPageRegex.test(result) ? result.match(lastPageRegex)[1] : 1
              return resolve({
                totalPage: parseInt(totalPage),
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