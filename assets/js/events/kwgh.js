(() => {
  let kwgh = {}

  /* Data */
  kwgh.eventKey = ''
  kwgh.config = {}
  kwgh.coupons = {}

  /* Core request */
  kwgh.play = null
  kwgh.bonus = null
  kwgh.load = null

  /* Init */
  kwgh.init = ({ eventKey, date, play, bonus, load }) => {
    kwgh.eventKey = eventKey
    kwgh.config = kwgh.getStorage('config')
    kwgh.coupons = kwgh.getStorage('coupons')
    kwgh.play = play
    kwgh.bonus = bonus
    kwgh.load = load

    const canPlay = !!play || !!bonus
    const leagueMode = !load

    const gameDialog = !leagueMode ? `
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
                <div id="content1" class="content kwgh-config">
                  <div class="margin">
                    ${canPlay ? `
                      <div class="form-group">
                        <label class="paper-check">
                          <input type="checkbox" name="kwgh-autoRun" onclick="kwgh.optionChanged(this)"${kwgh.config.autoRun !== false ? ' checked' : ''} /> <span>Auto run (Non-stop)</span>
                        </label>
                      </div>
                      <div class="form-group">
                        <label class="paper-check">
                          <input type="checkbox" name="kwgh-ignoreError" onclick="kwgh.optionChanged(this)"${kwgh.config.ignoreError === true ? ' checked' : ''} /> <span>Ignore error (Not recommended)</span>
                        </label>
                      </div>` : ''
                    }
                    <div class="form-group">
                      ${!!play ? '<button id="kwgh-btn-play" class="btn-secondary" onclick="kwgh.play()">Let\'s GO!</button>' : ''}
                      ${!!bonus ? '<button id="kwgh-btn-bonus" class="btn-secondary" onclick="kwgh.bonus()">Get bonus!</button>' : ''}
                      <button id="kwgh-btn-load" class="btn-secondary" onclick="kwgh.askLoad()">Load coupons</button>
                      <button id="kwgh-btn-clear" class="btn-danger" onclick="kwgh.askClear()">Clear coupons</button>
                    </div>
                  </div>
                </div>
                <div id="content2" class="content kwgh-coupon-list">
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Item</th>
                        <th>Coupon (Click to copy)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr class="kwgh-empty-content">
                        <td colspan="3">Nothing yet.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div id="content3" class="content kwgh-coupon-sn">
                  <div class="form-group margin-bottom-small">
                    <label popover-right="Copy all" onclick="this.nextElementSibling.select(); kwgh.copy(this.nextElementSibling.value, 'Coupons copied!')">Coupon list</label>
                    <textarea class="no-resize fix-height" placeholder="Nothing yet."></textarea>
                  </div>
                  <div class="alert alert-secondary margin-none padding-small">
                    💡 Tip: Use this coupon list with <a href="https://kinf.cc/2XHvUnv" target="_blank">KartAutoRedeem</a>!
                  </div>
                </div>
                <div id="content4" class="content kwgh-coupon-group">
                  <div class="kwgh-empty-content">
                    <p>Nothing yet.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      ` : ''
    const kwghTemplate = `
      <div id="kwgh" class="kwgh-wrap ${kwgh.eventKey}${leagueMode ? ' kwgh-league' : ''}">
        <nav class="border fixed split-nav">
          <div class="nav-brand">
            <h3>
              ${!leagueMode ?
                '<label for="collapsible-kwgh-dialog"><a>Get started</a></label>' :
                'League Mode'}
            </h3>
          </div>
          <div class="progress kwgh-loading">
            <div class="bar striped muted animated"></div>
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
                <li><label for="kwgh-about"><a>About KartWebGameHelper</a></label></li>
                <li><a href="https://github.com/brownsugar/KartWebGameHelper" target="_blank">GitHub</a></li>
              </ul>
            </div>
          </div>
        </nav>
        ${gameDialog}
        <div class="kwgh-modal">
          <input type="checkbox" id="kwgh-about" class="modal-state" />
          <div class="modal">
            <label class="modal-bg" for="kwgh-about"></label>
            <div class="modal-body">
              <label class="btn-close" for="kwgh-about">X</label>
              <h4 class="modal-title">KartWebGameHelper v${KWGH_VER}</h4>
              <h5 class="modal-subtitle">Just an assistant for KartRider web-based games.</h5>
              <ul>
                <li>Released on ${date}.</li>
                <li>Developed by <span><a href="https://brownsugar.tw" target="_blank">Brownsugar</a>.</li>
                <li>Published on <a href="https://kartinfo.me" target="_blank">KartInfo</a>.</li>
                <li>You can see more details <a href="https://kinf.cc/2unSmZc" target="_blank">here</a>.</li>
                <li>Awesome theme by <a href="https://github.com/papercss/papercss" target="_blank">PaperCSS</a>.</li>
              </ul>
            </div>
          </div>
        </div>
        <div class="kwgh-plugin kwgh-modal">
          <input type="checkbox" id="kwgh-message" class="modal-state" />
          <div class="modal">
            <label class="modal-bg" for="kwgh-message"></label>
            <div class="modal-body">
              <label class="btn-close" for="kwgh-message">X</label>
              <h4 id="kwgh-message-title" class="modal-title"></h4>
              <span id="kwgh-message-content">An unknown error occured.</span>
            </div>
          </div>
        </div>
        <div class="kwgh-plugin kwgh-toast">
          <input type="checkbox" id="kwgh-toast" class="alert-state" checked />
          <div class="alert dismissible">
            <p class="content">Alert-success</p>
            <label class="btn-close" for="kwgh-toast">X</label>
          </div>
        </div>
      </div>
    `
    kwgh.el.append('body', kwghTemplate)
  }

  /* Config */
  kwgh.optionChanged = el => {
    const [, name] = el.name.split('-')
    kwgh.config[name] = el.checked
    kwgh.setStorage('config', kwgh.config)
  }

  /* Ajax wrap */
  kwgh.ajax = {
    post: (url, { type = 'form', data, dataType, success, error } = {}) => {
      const contentTypes = {
        form: 'application/x-www-form-urlencoded',
        json: 'application/json'
      }
      let payload = data
      if (type == 'json') {
        payload = JSON.stringify(data)
      }

      return $.ajax({
        url: url,
        type: 'POST',
        contentType: contentTypes[type] + '; charset=UTF-8',
        async: true,
        data: payload,
        dataType: dataType || 'json',
        success: success,
        error: error || function(request, status, error) {
          return Promise.reject(`Network error.\nstatus: ${request.status}\nerror: ${error}`)
        }
      })
    }
  }

  /* Coupons */
  kwgh.addCoupons = () => {
    const groups = Object.keys(kwgh.coupons)
    if (!groups.length) {
      return
    }
    groups.forEach(group => {
      const items = kwgh.coupons[group]
      items.forEach(coupon => {
        kwgh.addCoupon(coupon)
      })
    })
  }

  kwgh.clearCoupons = () => {
    kwgh.coupons = {}
    kwgh.el.remove('.kwgh-coupon-list tbody > :not(.kwgh-empty-content)')
    kwgh.el.q('.kwgh-coupon-sn textarea').value = ''
    kwgh.el.remove('.kwgh-coupon-group > :not(.kwgh-empty-content)')
    kwgh.el.hide('.kwgh-empty-content', false)
  }

  kwgh.setCoupon = coupon => {
    if (!kwgh.coupons[coupon.id]) {
      kwgh.coupons[coupon.id] = []
    }
    kwgh.coupons[coupon.id].push(coupon)
    kwgh.setStorage('coupons', kwgh.coupons)
    kwgh.addCoupon(coupon)
  }

  kwgh.addCoupon = coupon => {
    if (!coupon) {
      return
    }

    kwgh.el.hide('.kwgh-empty-content')

    /* Item & Coupon */
    const list = `<tr>
                    <td>${kwgh.el.qa('.kwgh-coupon-list tbody tr:not(.kwgh-empty-content)').length + 1}</td>
                    <td>${coupon.name}</td>
                    <td><input class="coupon" type="text" value="${coupon.sn}" onclick="select(); kwgh.copy('${coupon.sn}', 'Coupon copied!')" readonly /></td>
                  </tr>`
    kwgh.el.append('.kwgh-coupon-list tbody', list)
    kwgh.el.toBottom('.kwgh-coupon-list')

    /* Coupon only */
    const couponList = kwgh.el.q('.kwgh-coupon-sn textarea').value + '\n' + coupon.sn
    kwgh.el.q('.kwgh-coupon-sn textarea').value = couponList.trim()
    kwgh.el.toBottom('.kwgh-coupon-sn textarea')

    /* Coupon group */
    let target = kwgh.el.q(`.kwgh-coupon-group [data-item="${coupon.id}"] textarea`)
    if (target) {
      target.value = target.value + '\n' + coupon.sn
    }
    else {
      const html = `<div class="form-group" data-item="${coupon.id}">
                      <label popover-right="Copy all" onclick="this.nextElementSibling.select(); kwgh.copy(this.innerText + '\\n' + this.nextElementSibling.value, 'Coupons copied!')">${coupon.name}</label>
                      <textarea class="no-resize" placeholder="Nothing yet.">${coupon.sn}</textarea>
                    </div>`
      kwgh.el.append('.kwgh-coupon-group', html)
    }
  }

  kwgh.askLoad = () => {
    if (confirm('Confirm clear saved coupons and pull data from server?\nThis could take some time, depends on how many coupons you\'ve got.')) {
      kwgh.clearStorage('coupons')
      kwgh.clearCoupons()
      kwgh.load()
    }
  }

  kwgh.askClear = () => {
    if (confirm('Confirm clear all saved coupons?')) {
      kwgh.loading()
      kwgh.btnLoading('#kwgh-btn-clear', 'Clearing...')
      setTimeout(() => {
        kwgh.clearStorage('coupons')
        kwgh.clearCoupons()
        kwgh.message('success', 'All coupons have been cleared.')
        kwgh.loading(false)
        kwgh.btnLoading('#kwgh-btn-clear', false)
      }, 0)
    }
  }

  /* League mode */
  kwgh.leagueMode = () => {
    const isLogin = !!kwgh.el.q('#gnbMyInfo') || // NEXON
                    !!kwgh.el.q('.nick') // NAVER

    const isLive = window.IsLive

    // Check if is logined or live event starts
    if (!isLogin || !isLive) {
      const limit = 60
      let count = 0
      const interval = setInterval(() => {
        const type = !isLogin ? 'danger' : 'secondary'
        const message = !isLogin ? 'Please login first!' : 'Waiting for the live event starts...'
        kwgh.toast(type, `${message}<br />Page will refresh in ${limit - count}s.`, 0)
        count++
        if (count > limit) {
          clearInterval(interval)
          window.location.reload()
          return
        }
      }, 1000)
      return
    }

    kwgh.toast('success', 'Start collecting the league emblems...', 0)
    kwgh.loading()
    const interval = setInterval(() => {
      const emblemWrap = kwgh.el.q('.emblem')
      const emblem = kwgh.el.q('.emblem a')
      if (emblemWrap.style.display !== 'none' && emblem !== null) {
        window.LeagueEmblem && window.LeagueEmblem.EmblemClick()
      }
      const emblemGot = kwgh.el.qa('.em_list .media_sp.acquisition').length
      if (emblemGot === 4) {
        clearInterval(interval)
        kwgh.toast('success', 'Done! You\'ve collected 4 league emblems.', 0)
        kwgh.loading(false)
        return
      }
    }, 5000)
  }

  /* Dismiss messages */
  const dismissKey = 'kwgh'
  const dismissName = 'dismiss'
  kwgh.setDismiss = path => {
    let data = kwgh.getDismiss()

    const index = data.findIndex(d => d.path === path)
    const time = (new Date()).getTime()
    if (index > -1) {
      data[index].time = time
    }
    else {
      data.push({
        path,
        time: time
      })
    }
    kwgh.setStorage(dismissName, data, dismissKey)
  }

  kwgh.getDismiss = () => {
    return kwgh.getStorage(dismissName, dismissKey, [])
  }

  kwgh.isDismiss = path => {
    let data = kwgh.getDismiss()

    const index = data.findIndex(d => d.path === path)
    const time = (new Date()).getTime()
    const limit = 24 * 60 * 60 * 1000 // 1 day
    // const limit = 60 * 1000 // 1 minute
    if (index > -1) {
      return time - data[index].time < limit
    }
    return false
  }

  /* LocalStorage */
  kwgh.setStorage = (name, data, key = kwgh.eventKey) => {
    localStorage.setItem(`${key}-${name}`, JSON.stringify(data))
  }

  kwgh.getStorage = (name, key = kwgh.eventKey, defaultValue = {}) => {
    try {
      return JSON.parse(localStorage.getItem(`${key}-${name}`)) || defaultValue
    }
    catch (e) {
      return defaultValue
    }
  }

  kwgh.clearStorage = name => {
    localStorage.removeItem(`${kwgh.eventKey}-${name}`)
  }

  /* Plugin */
  kwgh.message = (type, text = '') => {
    const titles = {
      success: '✅ Success!',
      error: '❌ Error!'
    }
    kwgh.el.q('#kwgh-message-title').innerText = titles[type]
    kwgh.el.q('#kwgh-message-content').innerHTML = text.toString().replace(/\n/g, '<br />')
    kwgh.el.q('#kwgh-message').checked = true
  }

  kwgh.copy = (text, successText = 'Copied!') => {
    const handler = e => {
      e.clipboardData.setData('text/plain', text)
      e.preventDefault()
      document.removeEventListener('copy', handler, true)
    }
    document.addEventListener('copy', handler, true)
    document.execCommand('copy')
    kwgh.toast('success', successText)
  }

  let toastTimer = null
  kwgh.toast = (type, text, timeout = 3000) => {
    // type: primary, secondary, success, warning, danger
    let checkbox = kwgh.el.q('#kwgh-toast'),
        alert = kwgh.el.q('.kwgh-toast .alert'),
        content = kwgh.el.q('.kwgh-toast .content')
    checkbox.checked = true

    // 200 = transition duration
    const delay = toastTimer ? 200 : 0
    setTimeout(() => {
      alert.className = alert.className.replace(/alert-(\w+)/i, '').trim()
      alert.classList.add(`alert-${type}`)
      content.innerHTML = text
      checkbox.checked = false

      if (timeout > 0) {
        clearTimeout(toastTimer)
        toastTimer = setTimeout(() => {
          checkbox.checked = true
          toastTimer = null
        }, timeout)
      }
    }, delay)
  }

  kwgh.loading = (loading = true) => {
    if (loading)
      kwgh.el.q('.kwgh-loading').classList.add('show')
    else
      kwgh.el.q('.kwgh-loading').classList.remove('show')
  }

  kwgh.btnLoading = (el, loading = true, disabled = true) => {
    const button = kwgh.el.q(el)
    if (!button) {
      return
    }
    if (loading) {
      button.dataset.origtext = button.innerText
      button.innerText = loading === true ? 'Loading...' : loading
      button.disabled = disabled
    }
    else {
      button.innerText = button.dataset.origtext
      button.dataset.origtext = ''
      button.disabled = false
    }
  }

  /* Utils */
  kwgh.el = {
    q: (el, parent = null) => (parent || document).querySelector(el),
    qa: (el, parent = null) => (parent || document).querySelectorAll(el),
    hide: (el, hide = true) => {
      [...kwgh.el.qa(el)].forEach(el => el.style.display = hide ? 'none' : '')
    },
    append: (el, html) => {
      document.querySelector(el).insertAdjacentHTML('beforeend', html)
    },
    remove: el => {
      [...kwgh.el.qa(el)].forEach(el => el.parentNode.removeChild(el))
    },
    toBottom: el => {
      const target = kwgh.el.q(el)
      target.scrollTop = target.scrollHeight
    }
  }

  /* Track */
  kwgh.ev = (category, action, label = '', value = '') => {
    gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value
    })
  }

  window.kwgh = kwgh
})()