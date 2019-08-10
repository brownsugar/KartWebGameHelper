(() => {
  const EVENT_KEY = 'kwgh-taiwan-2019-0810'
  let isBusy = false

  kwgh.init({
    eventKey: EVENT_KEY,
    date: '2019/08/11',
    load: load
  })
  kwgh.addCoupons(kwgh.coupons)

  kwgh.el.q('#layerItemList').style.zIndex = 0

  function load() {
    if (isBusy) {
      return
    }
    isBusy = true
    kwgh.loading()
    kwgh.btnLoading('#kwgh-btn-load')
    kwgh.ev(EVENT_KEY, 'load', 'click')

    doLoad()
  }
  function doLoad() {
    loadRequest().then(({ totalItem, couponList = [] }) => {
      couponList.forEach(data => {
        const coupon = {
          id: data.ItemID,
          name: data.ItemName,
          sn: data.SN
        }
        kwgh.setCoupon(coupon)
      })
      kwgh.message('success', `${totalItem} coupons have been loaded.`)
      isBusy = false
      kwgh.loading(false)
      kwgh.btnLoading('#kwgh-btn-load', false)
      kwgh.ev(EVENT_KEY, 'load', 'totalItem', totalItem)
    }).catch(message => {
      kwgh.message('error', message)
      isBusy = false
      kwgh.loading(false)
      kwgh.btnLoading('#kwgh-btn-load', false)
    })
  }
  function loadRequest() {
    return new Promise((resolve, reject) => {
      const html = kwgh.el.q('body').innerHTML
      const regex = /ShowList\((\[.*\])\)/i

      if (regex.test(html)) {
        const data = html.match(regex)[1]
        const json = JSON.parse(data)
        return resolve({
          totalItem: json.length,
          couponList: json
        })
      }
      return reject('No coupon found.')
    })
  }
})()