(() => {
  const EVENT_KEY = 'kwgh-china-2020-1015'
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

  const remainCoinEl = kwgh.el.q('.qty1')
  const useCoinEl = kwgh.el.q('.qty2')
  const totalCoinEl = kwgh.el.q('.qty3')
  let remainCoin = Number(remainCoinEl.innerText)
  let useCoin = Number(useCoinEl.innerText)
  let totalCoin = Number(totalCoinEl.innerText)
  kwgh.ev(EVENT_KEY, 'jewelry', 'count', totalCoin)

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
    //   "code": "0000000000000000000000000",
    //   "name": "道具换位卡(50个)",
    //   "time": "2020-10-19 23:04:20",
    //   "type": 19
    // }
    playRequest().then(data => {
      // Change page data
      remainCoin = remainCoin - playCoinConsume
      remainCoinEl.innerText = remainCoin
      useCoin = useCoin + playCoinConsume
      useCoinEl.innerText = useCoin

      if (!data.code)
        return

      const coupon = {
        id: data.type,
        name: data.name,
        sn: data.code
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
      if (remainCoin < playCoinConsume) {
        return reject('Jewelry not enough.')
      }

      // {
      //   "irv": 200,
      //   "msg": "成功返回",
      //   "data": {
      //     "code": "0000000000000000000000000",
      //     "name": "道具换位卡(50个)",
      //     "time": "2020-10-19 23:04:20"
      //   },
      //   "type": 19
      // }
      kwgh.ajax.post('index.php/lottery', {
        success: result => {
          if (result != null) {
            if (result.irv === 102) {
              return reject('Not logged in.')
            }
            else if (result.irv === 200) {
              result.data.type = result.type
              return resolve(result.data)
            }
            return reject(result.msg)
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
      // {
      //   "result": [
      //     {
      //       "type": "20",
      //       "item_name": "道具变更卡(50个)",
      //       "coupon_code": "0000000000000000000000000",
      //       "create_time": "2020-10-19 23:21:27"
      //     }
      //   ],
      //   "irv": 200,
      //   "msg": "成功返回"
      // }
      kwgh.ajax.post('index.php/reward', {
        success: result => {
          if (result != null) {
            if (result.irv === 102) {
              return reject('Not logged in.')
            }
            else if (result.irv === 200) {
              if (result.result.length) {
                const snData = result.result.map(sn => ({
                  itemNo: sn.type,
                  itemName: sn.item_name,
                  coupon: sn.coupon_code
                }))
                return resolve({
                  couponList: snData
                })
              }
              return reject('No coupon found.')
            }
            return reject(result.msg)
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