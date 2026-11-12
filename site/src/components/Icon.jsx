export default function Icon({ name, size = 18, className = '' }) {
  const icons = {
    logo: <><rect x="6" y="6" width="12" height="12" rx="2" /><path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4" /></>,
    play: <path d="m8 5 11 7-11 7Z" />,
    pause: <path d="M8 5v14M16 5v14" />,
    next: <><path d="m5 5 10 7-10 7Z" /><path d="M19 5v14" /></>,
    previous: <><path d="m19 5-10 7 10 7Z" /><path d="M5 5v14" /></>,
    reset: <><path d="M3 10a9 9 0 1 1 2.7 8.4" /><path d="M3 4v6h6" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    box: <><path d="m12 3 9 5-9 5-9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>,
    layers: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /><path d="M10 7h7v7M7 10v7h7" /></>,
    globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></>,
    shield: <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z" /><path d="m9 12 2 2 4-5" /></>,
    database: <><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7" /></>,
    code: <><path d="m8 6-6 6 6 6M16 6l6 6-6 6M14 3l-4 18" /></>,
    cpu: <><rect x="6" y="6" width="12" height="12" rx="2" /><path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4" /></>,
    file: <><path d="M6 2h8l5 5v15H6Z" /><path d="M14 2v6h5M9 13h6m-6 4h6" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    warning: <><path d="m12 3 10 18H2Z" /><path d="M12 9v5m0 3v.1" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6m0-10v.1" /></>,
    mouse: <><rect x="6" y="2" width="12" height="20" rx="6" /><path d="M12 6v4" /></>,
    link: <><path d="m10 13 4-4m-6 7-2 2a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m4-2 2-2a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0" transform="translate(1 1) scale(.9)" /></>,
    trash: <><path d="M3 6h18M9 6V3h6v3M5 6l1 16h12l1-16M10 10v8m4-8v8" /></>,
    cycle: <><path d="M3 12a9 9 0 0 1 15.5-6.2M21 12a9 9 0 0 1-15.5 6.2" /><path d="M18.5 1.5v4.5H14M5.5 22.5v-4.5H10" /></>,
    split: <><circle cx="5" cy="6" r="2.4" /><circle cx="5" cy="18" r="2.4" /><circle cx="19" cy="12" r="2.4" /><path d="M7.2 7.2 15.9 10.9M7.2 16.8 15.9 13.1" /></>,
    sliders: <><path d="M4 8h9M19 8h1M4 16h3M13 16h7" /><circle cx="16" cy="8" r="2.2" /><circle cx="10" cy="16" r="2.2" /></>,
    list: <><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.6" cy="6" r="1.1" /><circle cx="4.6" cy="12" r="1.1" /><circle cx="4.6" cy="18" r="1.1" /></>,
  };
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icons[name] || icons.box}</svg>;
}

export function NodeGlyph({ kind, size = 18 }) {
  const names = {
    application: 'cpu', scan: 'layers', imports: 'layers', properties: 'file', 'auto-configuration': 'box',
    service: 'box', 'custom-bean': 'code', bpp: 'cpu', ready: 'check', client: 'globe', filter: 'shield',
    auth: 'shield', dispatcher: 'arrow', interceptor: 'link', controller: 'code', transaction: 'cpu',
    repository: 'layers', database: 'database', component: 'box',
    'bean-definition': 'file', instantiate: 'box', populate: 'link', init: 'cycle', 'ready-bean': 'check',
    caller: 'code', proxy: 'split', 'tx-interceptor': 'cpu', 'target-method': 'box', 'self-call': 'link', commit: 'check',
    'condition-evaluator': 'sliders', 'condition-property': 'file', 'condition-class': 'layers',
    'condition-bean': 'code', 'feature-service': 'box', report: 'file',
    'metadata-reader': 'file', 'bean-metadata': 'box', 'definition-registry': 'database',
    'instantiation-point': 'cycle', 'positive-matches': 'check', 'negative-matches': 'warning',
    'actuator-endpoint': 'globe',
  };
  return <Icon name={names[kind] || 'box'} size={size} />;
}
