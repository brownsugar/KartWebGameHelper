(() => {
  const EVENT_KEY = 'kwgh-korea-2022-0310'
  const playCoinConsume = 2
  const requestInterval = 600
  let isBusy = false

  kwgh.init({
    eventKey: EVENT_KEY,
    date: '2022/03/15',
    play: play,
    load: load
  })
  kwgh.addCoupons(kwgh.coupons)

  const remainCoinEl = kwgh.el.q('#EventCoin')
  const useCoinEl = kwgh.el.q('#WebUseCoin')
  const totalCoinEl = kwgh.el.q('#TotalCoin')
  kwgh.ev(EVENT_KEY, 'jewelry', 'count', lcdToNumber(totalCoinEl))

  function lcdToNumber (el) {
    const numbersEl = [...kwgh.el.qa('span', el)]
    const numberString = numbersEl.map(el => {
      const number = el.className.replace('j_n j_n', '')
      return number
    }).join('')
    return Number(numberString)
  }

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
      //       "itemIndex": 2,
      //       "itemNo": 2414,
      //       "itemName": "유니크 파츠 X (무제한)"
      //     }
      //   ],
      //   "CouponNo": "00000-00000-00000-00000-00000",
      //   "InGameCoin": 81,
      //   "WebUseCoin": 4,
      //   "EventCoin": 77
      // }

      const item = data.ItemList[0]

      // Set roulette rotation
      const angle = 360 - (360 / 12 * (item.itemIndex - 1))
      kwgh.el.q('#roulette #img').style.transform = `rotate(${angle}deg)`

      // Change page data
      // `roulette`: https://kart.nexon.com/events/2022/0310/Event.aspx
      remainCoin = data.EventCoin
      remainCoinEl.innerHTML = roulette.intTostring(remainCoin)
      const useCoin = data.WebUseCoin
      useCoinEl.innerHTML = roulette.intTostring(useCoin)
      const totalCoin = data.InGameCoin
      totalCoinEl.innerHTML = roulette.intTostring(totalCoin)

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
      kwgh.ajax.post('AjaxPlay.aspx', {
        success: result => {
          if (result != null) {
            if (result.returnCode == 0) {
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
      //   Event220310.LayerAlert("<span class='pt_c1'>로그인 후</span> 확인해 주세요.");
      // </script>
      // OR
      // <ul class="item_data_list">
      //   <li>
      //     <dl class="coupon">
      //       <dt class="blind">아이템 이미지</dt>
      //       <dd class="tmb">
      //         <span class="item i2415">V1 파츠 조각 (30개)</span>
      //       </dd>
      //       <dt class="blind">당첨일</dt>
      //       <dd class="date">2022-03-15 23:47</dd>
      //       <dt class="blind">아이템</dt>
      //       <dd class="name">V1 파츠 조각 (30개)</dd>
      //       <dt class="blind">유효기간</dt>
      //       <dd class="validity">2022-03-30 23:59</dd>
      //       <dt class="blind">쿠폰번호</dt>
      //       <dd class="key">00000-00000-00000-00000-00000</dd>
      //     </dl>
      //   </li>
      // </ul>
      // <div class="pager">
      //   <button type="button" class="btn btn_fr " onclick="Event220310.CouponListDate(1)" >처음</button>
      //   <button type="button" class="btn btn_pv disabled"  onclick="return false;" >이전</button>
      //   <span>
      //     <a href="javascript:void(0);" onclick="Event220310.CouponListDate(1)">1</a><strong>2</strong><a href="javascript:void(0);" onclick="Event220310.CouponListDate(3)">3</a>
      //   </span>
      //   <button type="button" class="btn btn_nx disabled" onclick="return false;">다음</button>
      //   <button type="button" class="btn btn_ls " onclick="Event220310.CouponListDate(3)">마지막</button>
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
              const lastPageRegex = /onclick=\"Event220310.CouponListDate\((\d+)\)\">마지막/i
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