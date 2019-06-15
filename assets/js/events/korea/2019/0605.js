(() => {
  const EVENT_KEY = 'kwgh-korea-2019-0605'
  const ajaxInterval = 600

  kwgh.init({
    eventKey: EVENT_KEY,
    date: '2019/06/15',
    play: play,
    load: load
  })
  kwgh.addCoupons(kwgh.coupons)
  kwgh.ev('game', 'jewelry', 'count', parseInt(kwgh.el.q('.amount3').innerText))

  let isBusy = false

  let getCount
  function play() {
    if (isBusy) {
      isBusy = false
      return
    }
    isBusy = true
    kwgh.loading()
    kwgh.ev('game', 'play', 'click')
    if (kwgh.config.autoRun) {
      kwgh.btnLoading('#kwgh-btn-play', 'STOP', false)
      kwgh.ev('game', 'play', 'autoRun', 1)
    }
    else {
      kwgh.btnLoading('#kwgh-btn-play', 'Working...')
      kwgh.ev('game', 'play', 'autoRun', 0)
    }

    getCount = 0
    doPlay()
  }
  function doPlay() {
    let error = false

    playRequest().then(data => {
      // Change page data
      remainCoin = remainCoin - 2
      $('#remainCoin').text(remainCoin)
      $('#n4WebUseCoin').text(parseInt($('#n4WebUseCoin').text()) + 2)

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
        kwgh.ev('game', 'play', 'getCount', getCount)
      }
      else {
        setTimeout(() => {
          doPlay()
        }, ajaxInterval)
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
      //   "getItemName": "코인 (500개)",
      //   "getItemNo": 1988
      // }
      kwgh.ajax.post('Play.aspx', {
        success: result => {
          if (result != null) {
            if (result.retCode == 0) {
              resolve(result)
            }
            else {
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
    kwgh.ev('game', 'load', 'click')

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
        kwgh.ev('game', 'load', 'totalItem', totalItem)
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
      //    "n4totCnt": 21, // Total
      //    "strCouponList": [
      //       {
      //          "n4index": 21, // Index
      //          "strCoupon": "00000-00000-00000-00000-00000",
      //          "n4ItemNo": 1998,
      //          "n4ItemIndex": 15,
      //          "strItemName": "라이더명 변경권 (1개)",
      //          "dtCreate": "2019. 06. 13 10:51"
      //       }
      //    ]
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