console.log(imagePicker)
window.onload = function() {
  redirectToRecurseSubdomainIfNeeded()
  setupLogin()
}

function redirectToRecurseSubdomainIfNeeded() {
  // TODO
}

function parseCookies(cookieString) {
  const cookies = cookieString.split('; ')
  const cookiesDict = {}
  for (const cookie of cookies) {
    const [key, value] = cookie.split('=', 2)
    cookiesDict[key] = value
  }
  return cookiesDict
}

function p(text) {
  const el = document.createElement('p')
  el.innerHTML = text
  return el
}

function setupLogin() {
  if (!window.location.origin.match(/.recurse.com\/?$/)) {
    loginDiv.appendChild(p('This is not a *.recurse.com subdomain, so it will not be able to make authenticated requests to <a href="https://receipt.recurse.com">https://receipt.recurse.com</a>.'))
    return
  }
  const cookies = parseCookies(document.cookie)
  if ('receipt_csrf' in cookies) {
    loginDiv.appendChild(p('You are logged in.'))
    return
  }
  const a = document.createElement('a')
  a.href = `https://receipt.recurse.com/login?redirect_uri=${window.location.href}`
  a.innerHTML = 'login'
  loginDiv.appendChild(a)
}
