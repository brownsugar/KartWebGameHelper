(() => {
  const EVENT_KEY = 'kwgh-korea-2019-1024'
  const playCoinConsume = 4
  const requestInterval = 600
  let isBusy = false

  kwgh.init({
    eventKey: EVENT_KEY,
    date: '2019/10/27',
    play: play,
    load: load
  })
  kwgh.addCoupons(kwgh.coupons)
  kwgh.ev(EVENT_KEY, 'jewelry', 'count', parseInt(kwgh.el.q('#TotalCoin').innerText))

  const remainCoinEl = kwgh.el.q('#remainCoin')
  const useCoinEl = kwgh.el.q('#n4WebUseCoin')

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
      // {
      //   "retCode": 0,
      //   "strCouponNo": "00000-00000-00000-00000-00000",
      //   "getItemName": "호박 할로윈 전자파밴드 (30개)",
      //   "getItemNo": 2114,
      //   "itemIdx": 17,
      //   "gameCoin": 222,
      //   "useCoin": 2
      // }

      // Set roulette rotation
      // items: defined in event page source
      kwgh.el.q('#img').style.transform = `rotate(${360 - 360 / items.length * data.itemIdx}deg)`

      // Change page data
      remainCoin = remainCoin - playCoinConsume
      remainCoinEl.innerText = remainCoin
      useCoinEl.innerText = data.useCoin

      if (!data.strCouponNo)
        return

      const coupon = {
        id: data.getItemNo,
        name: data.getItemName,
        sn: data.strCouponNo
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
      if (isEventState == 0) {
        return reject('Not in event period.')
      }
      if (isLoginState == 0) {
        return reject('Not loggined.')
      }
      if (isLoginState == -1) {
        return reject('Not agreed to provide third party personal information.')
      }
      if (isLoginState == -2) {
        return reject('Not created character.')
      }
      if (remainCoin < playCoinConsume) {
        return reject('Jewelry not enough.')
      }

      // {
      //   "retCode": 0,
      //   "strCouponNo": "00000-00000-00000-00000-00000",
      //   "getItemName": "호박 할로윈 전자파밴드 (30개)",
      //   "getItemNo": 2114,
      //   "itemIdx": 17,
      //   "gameCoin": 222,
      //   "useCoin": 2
      // }
      kwgh.ajax.post('Play.aspx', {
        success: result => {
          if (result != null) {                        
            if (result.retCode == 0) {
              resolve(result)
            } else if (result.retCode == -1) {
              return reject('Coupon not enough, jewels had been returned.')
            } else {
              return reject(result.strCouponNo)
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
    doLoad(1)
  }
  function doLoad(page) {
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
      if (isLoginState == 0) {
        return reject('Not loggined.')
      }
      if (isLoginState == -1) {
        return reject('Not agreed to provide third party personal information.')
      }
      if (isLoginState == -2) {
        return reject('Not created character.')
      }

      // WTF
      // <div class="item_list">
      //   <ul>
      //     <li>
      //       <dl class="coupon">
      //         <dt class="blind">아이템 이미지</dt>
      //         <dd class="tmb">
      //           <span class="item i2114">호박 할로윈 전자파밴드 (30개)</span>
      //         </dd>
      //         <dt class="blind">당첨일</dt>
      //         <dd class="date">2019. 10. 27 01:28</dd>
      //         <dt class="blind">아이템</dt>
      //         <dd class="name">호박 할로윈 전자파밴드 (30개)</dd>
      //         <dt class="blind">유효기간</dt>
      //         <dd class="validity">2019-11-20 23:59</dd>
      //         <dt class="blind">쿠폰번호</dt>
      //         <dd class="key">00000-00000-00000-00000-00000</dd>                
      //       </dl>
      //     </li>
      //   </ul>
      //   <div class="pager">
      //     <button type="button" class="btn btn_fr" onclick="return false;">처음</button>
      //     <button type="button" class="btn btn_pv" onclick="return false;">이전</button>
      //     <span><strong title="현재 페이지">1</strong></span>
      //     <button type="button" class="btn btn_nx" onclick="return false;">다음</button>
      //     <button type="button" class="btn btn_ls" onclick="return false;">마지막</button>
      //   </div>
      // </div>
      kwgh.ajax.post('MyCouponList.aspx', {
        data: {
          n4Page: page
        },
        dataType: 'html',
        success: result => {
          if (result != null) {
            if (/class=\"item_list\"/i.test(result)) {
              const itemRegex = /<span class="item i(\d+)">([^<]+)<\/span>/ig
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
              const pageDataRegex = /onclick=\"CouponListDate\((\d+)\)\">마지막<\/button>/i
              const totalPage = pageDataRegex.test(result) ? result.match(pageDataRegex)[1] : 1
              resolve({
                totalPage: parseInt(totalPage),
                couponList: snData
              })
            }
            else {
              return reject('No coupon found.')
            }
          }
          else {
            return reject('Unknown error.')
          }
        },
        error: (request, status, error) => {
          return reject(`Network error.\nstatus: ${request.status}\nerror: ${error}`)
        }
      })
    })
  }
})()