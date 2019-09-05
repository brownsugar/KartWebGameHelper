(() => {
  const eventPageRegex = {
    korea: [/\/Events\/(\d+)\/(\d+)\//i],
    taiwan: [/\/kartrider\/E(\d{4})(\d{4})\/(index|SearchItem)\./i],
    china: [/evt0(\d)\.tiancity\.com\/kart\/(\d+)\//i]
  }

  let region, regex
  for (let key of Object.keys(eventPageRegex)) {
    const regexs = eventPageRegex[key]
    regexs.some(r => {
      if (r.test(window.location.href)) {
        region = key
        regex = r
        return true
      }
    })
    if (region) break
  }

  if (!region) return

  // year = domain id, date = event id in PK
  const [, year, date] = window.location.href.match(regex)

  insertStyle('https://fonts.googleapis.com/css?family=Neucha|Patrick+Hand+SC', false)
  insertStyle('https://fonts.googleapis.com/css?family=Noto+Sans+KR&display=swap', false)
  insertScript('https://www.googletagmanager.com/gtag/js?id=UA-17631526-18', false, true)
  insertInlineScript(`
    const KWGH_VER = '${chrome.runtime.getManifest().version}'
    const KWGH_UILANG = '${chrome.i18n.getUILanguage()}'
    const KWGH_URL = '${chrome.runtime.getManifest().homepage_url}'
  `)
  insertInlineScript(`
    window.dataLayer = window.dataLayer || []
    function gtag() { dataLayer.push(arguments) }
    gtag('js', new Date())
    gtag('config', 'UA-17631526-18')
  `)
  insertScript('assets/js/events/kwgh.js').then(() => {
    insertScript('assets/js/events/analytics.js')
    if (kwghEvents[region].hasOwnProperty(year) && kwghEvents[region][year].indexOf(date) > -1) {
      insertScript(`assets/js/events/${region}/${year}/${date}.js`)
    }
    else {
      insertScript('assets/js/events/default.js')
    }
  })

  function insertStyle(path, local = true) {
    const s = document.createElement('link')
    s.rel = 'stylesheet'
    s.href = local ? chrome.runtime.getURL(path) : path
    document.body.append(s)
  }

  function insertScript(path, local = true, async = false) {
    return new Promise(resolve => {
      const s = document.createElement('script')
      s.src = local ? chrome.runtime.getURL(path) : path
      s.async = async
      s.onload = resolve
      document.body.append(s)
    })
  }

  function insertInlineScript(script) {
    const s = document.createElement('script')
    s.textContent = script;
    document.body.append(s)
  }
})()