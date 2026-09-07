const redirects = async () => {
  const internetExplorerRedirect = {
    destination: '/ie-incompatible.html',
    has: [
      {
        type: 'header',
        key: 'user-agent',
        value: '(.*Trident.*)', // all ie browsers
      },
    ],
    permanent: false,
    source: '/:path((?!ie-incompatible.html$).*)', // all pages except the incompatibility page
  }

  // Plan Your Visit was merged into Book Your Appointment (Sep 2026).
  const planYourVisitRedirect = {
    source: '/plan-your-visit',
    destination: '/book-an-appointment',
    permanent: true,
  }

  const redirects = [internetExplorerRedirect, planYourVisitRedirect]

  return redirects
}

export default redirects
