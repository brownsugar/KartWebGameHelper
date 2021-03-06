(() => {
  const EVENT_KEY = 'kwgh-taiwan-2020-1016'
  const playCoinConsume = 2
  const requestInterval = 500
  let isBusy = false

  kwgh.init({
    eventKey: EVENT_KEY,
    date: '2020/10/20',
    play: play,
    load: load
  })
  kwgh.addCoupons(kwgh.coupons)

  const isLogin = kwgh.el.q('#hfLoginStatus').value === 'Y'
  const remainCoinEl = kwgh.el.q('#lblNum1')
  const useCoinEl = kwgh.el.q('#lblNum2')
  const totalCoinEl = kwgh.el.q('#lblNum3')
  let remainCoin = Number(remainCoinEl.innerText)
  let useCoin = Number(useCoinEl.innerText)
  let totalCoin = Number(totalCoinEl.innerText)
  kwgh.ev(EVENT_KEY, 'jewelry', 'count', totalCoin)

  async function keepSession() {
    if (!isBusy) {
      await kwgh.ajax.post('index.aspx/Refresh', {
        type: 'json',
        data: {
          DoubleOpenFlag: kwgh.el.q('#DoubleOpenFlag').value
        }
      })
    }
    setTimeout(keepSession, 30000)
  }
  if (isLogin) {
    keepSession()
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

    // {
    //   ImageID: 11
    //   ItemAmount: "200"
    //   ItemID: 11405
    //   ItemName: "KOIN"
    //   Seq: 71230
    // }
    playRequest().then(data => {
      // Change page data
      remainCoin = remainCoin - playCoinConsume
      remainCoinEl.innerText = remainCoin
      useCoin = useCoin + playCoinConsume
      useCoinEl.innerText = useCoin

      const coupon = {
        id: data.ItemID,
        name: window.itemNames[data.ImageID - 1], // https://event.beanfun.com/kartrider/E20201016/js/default.js
        sn: '-'
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
      if (!isLogin) {
        return reject('Not logged in.')
      }
      if (remainCoin < playCoinConsume) {
        return reject('Jewelry not enough.')
      }

      // {
      //   "code": "1",
      //   "message": "Success",
      //   "data": "[{\"Seq\":71230,\"ItemID\":11405,\"ItemName\":\"KOIN\",\"ImageID\":11,\"ItemAmount\":\"200\"}]",
      //   "url": ""
      // }
      kwgh.ajax.post('index.aspx/Push', {
        type: 'json',
        data: {
          DoubleOpenFlag: kwgh.el.q('#DoubleOpenFlag').value
        },
        success: result => {
          if (result != null) {
            try {
              const d = JSON.parse(result.d)

              if (d.code == '1') {
                const data = JSON.parse(d.data)
                return resolve(data[0])
              }
              return reject(d.message)
            }
            catch (e) {
              return reject(e)
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
          id: data.ImageID,
          name: window.itemNames[data.ImageID - 1],
          sn: '-'
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
      if (!isLogin) {
        return reject('Not logged in.')
      }

      // {
      //   "code": "1",
      //   "message": "Success",
      //   "data": "[{\"TotalCount\":1,\"RowNo\":1,\"ImageID\":11,\"ItemName\":\"KOIN\",\"ItemAmount\":\"200\",\"CreateDate\":\"2020-10-20 00:04\"}]",
      //   "url": ""
      // }
      kwgh.ajax.post('index.aspx/ShowList', {
        type: 'json',
        data: {
          Page: page,
          DoubleOpenFlag: kwgh.el.q('#DoubleOpenFlag').value
        },
        success: result => {
          if (result != null) {
            try {
              const d = JSON.parse(result.d)

              if (d.code == '1') {
                const data = JSON.parse(d.data)
                if (data.length) {
                  return resolve({
                    totalPage: Math.ceil(data[0].TotalCount / 6),
                    couponList: data
                  })
                }
                return reject('No coupon found.')
              }
              return reject(d.message)
            }
            catch (e) {
              return reject(e)
            }
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