(() => {
  const EVENT_KEY = 'kwgh-taiwan-2019-0829'
  const requestInterval = 600
  let isBusy = false

  kwgh.init({
    eventKey: EVENT_KEY,
    date: '2019/08/31',
    play: play,
    load: load
  })
  kwgh.addCoupons(kwgh.coupons)
  kwgh.ev(EVENT_KEY, 'jewelry', 'count', parseInt(kwgh.el.q('.qty3').innerText))

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
      // Set roulette rotation
      kwgh.el.q('#img').style.transform = `rotate(${360 - 360 / items.length * data.itemIdx}deg)`

      // Change page data
      remainCoin = remainCoin - 2
      remainCoinEl.innerText = remainCoin
      useCoinEl.innerText = parseInt(useCoinEl.innerText) + 2

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
      if (!isBusy || error && !kwgh.config.ignoreError || !kwgh.config.autoRun || kwgh.config.autoRun && remainCoin < 2) {
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
      if (remainCoin < 2) {
        return reject('Jewelry not enough.')
      }

      // {
      //   "retCode": 0,
      //   "strCouponNo": "00000-00000-00000-00000-00000",
      //   "getItemName": "싱가포르 멀리 밴드 (50개)",
      //   "getItemNo": 2054,
      //   "itemIdx": 17
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
        },
        error: (request, status, error) => {
          return reject(`Network error.\nstatus: ${request.status}\nerror: ${error}`)
        }
      })
    })
  }

  function load() {
    if (isBusy) {
      return
    }
    isBusy = true
    kwgh.loading()
    kwgh.btnLoading('#kwgh-btn-load')
    kwgh.ev(EVENT_KEY, 'load', 'click')

    doLoad(1)
  }
  function doLoad(page) {
    loadRequest(page).then(({ totalPage = 1, totalItem, couponList = [] }) => {
      couponList.forEach(data => {
        const coupon = {
          id: data.n4ItemNo,
          name: data.strItemName,
          sn: data.strCoupon
        }
        kwgh.setCoupon(coupon)
      })
      if (page < totalPage) {
        setTimeout(() => {
          doLoad(++page)
        }, ajaxInterval)
      }
      else {
        kwgh.message('success', `${totalItem} coupons have been loaded.`)
        isBusy = false
        kwgh.loading(false)
        kwgh.btnLoading('#kwgh-btn-load', false)
        kwgh.ev(EVENT_KEY, 'load', 'totalItem', totalItem)
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

      // {
      //   "n4totCnt": 1,
      //   "strCouponList": [
      //     {
      //       "n4index": 1,
      //       "strCoupon": "00000-00000-00000-00000-00000",
      //       "n4ItemNo": 2054,
      //       "n4ItemIndex": 17,
      //       "strItemName": "싱가포르 멀리 밴드 (50개)",
      //       "dtCreate": "2019. 08. 31 02:53"
      //     }
      //   ]
      // }
      kwgh.ajax.post('MyCouponList.aspx', {
        data: {
          n4Page: page
        },
        success: result => {
          if (result != null) {
            if (result.n4totCnt > 0 && result.strCouponList.length > 0) {
              resolve({
                totalPage: Math.ceil(result.n4totCnt / 6),
                totalItem: result.n4totCnt,
                couponList: result.strCouponList
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