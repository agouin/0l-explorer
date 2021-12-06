export const pageview = (page_path, page_title) => {
  const pageViewJson = {
    page_path,
    page_title,
    page_location: window.location.href
  }
  //@ts-ignore
  window.gtag('event', 'page_view', pageViewJson)
  //console.log('GA pageview', pageViewJson)
}

export const outboundUrl = (url: string) => {
  const outboundUrlJson = {
    event_category: 'outbound',
    event_label: url,
    transport_type: 'beacon'
  }
  //@ts-ignore
  window.gtag('event', 'click', outboundUrlJson)
  //console.log('GA outbound URL', outboundUrlJson)
}

export const event = ({ action, category, label, value }) => {
  const eventJson = {
    event_category: category,
    event_label: label,
    value: value,
  }
  //@ts-ignore
  window.gtag('event', action, eventJson)
  //console.log('GA event', action, eventJson)
}
