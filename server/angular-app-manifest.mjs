
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: 'https://jesse-rr.github.io/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "route": "/"
  },
  {
    "renderMode": 2,
    "redirectTo": "/",
    "route": "/**"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 1272, hash: '713ab48ae13f748877917e9d0f870b8841a7d8370a3e308106144491f4eab54e', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1030, hash: '114eee39b6dab5bf0a5c8114d01f193f23e1f99bd3da5b4ae7f354e8ae20937d', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'index.html': {size: 3800, hash: 'ddde832ccadbb109c8f5c9905fe2c51f7c30e0256357c976f6c4835764ac81a5', text: () => import('./assets-chunks/index_html.mjs').then(m => m.default)},
    'styles-GQRM7QDT.css': {size: 1109, hash: 'GYq8zWElSg4', text: () => import('./assets-chunks/styles-GQRM7QDT_css.mjs').then(m => m.default)}
  },
};
