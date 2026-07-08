const TOKEN = {
    p: '#808080', tg: '#4EC9B0', at: '#9CDCFE', av: '#CE9178',
    tx: '#D4D4D4', kw: '#569CD6', fn: '#DCDCAA', st: '#CE9178',
    id: '#9CDCFE', op: '#D4D4D4', nb: '#4EC9B0', pr: '#9CDCFE',
    cm: '#6A9955', nm: '#B5CEA8', pu: '#C586C0',
};

const s = (color: string, text: string) =>
    `<span style="color:${color}">${text}</span>`;

const { p, tg, at, av, tx, kw, fn, st, id, op, nb, pr, nm, pu } =
    Object.fromEntries(
        Object.entries(TOKEN).map(([k, v]) => [k, (t: string) => s(v, t)])
    ) as Record<keyof typeof TOKEN, (t: string) => string>;

const CODE_LINES = [
    `${p('&lt;!')}${pu('DOCTYPE')} ${tg('html')}${p('&gt;')}`,
    `${p('&lt;')}${tg('html')} ${at('lang')}${p('=')}${av('"en"')}${p('&gt;')}`,
    `${p('&lt;')}${tg('head')}${p('&gt;')}`,
    `  ${p('&lt;')}${tg('meta')} ${at('charset')}${p('=')}${av('"UTF-8"')}${p('&gt;')}`,
    `${p('</')}${tg('head')}${p('>')}`,
    `${p('<')}${tg('body')}${p('>')}`,
    `  ${p('<')}${tg('p')} ${at('class')}${p('=')}${av('"label"')}${p('>')}${tx("You're invited")}${p('</')}${tg('p')}${p('>')}`,
    `  ${p('<')}${tg('h1')} ${at('id')}${p('=')}${av('"event_name"')}${p('></')}${tg('h1')}${p('>')}`,
    `  ${p('<')}${tg('p')} ${at('class')}${p('=')}${av('"meta"')} ${at('id')}${p('=')}${av('"datetime"')}${p('></')}${tg('p')}${p('>')}`,
    `  ${p('<')}${tg('p')} ${at('class')}${p('=')}${av('"location"')} ${at('id')}${p('=')}${av('"location"')}${p('></')}${tg('p')}${p('>')}`,
    `  ${p('<')}${tg('script')}${p('>')}`,
    `    ${kw('var')} ${id('d')} ${op('=')} ${nb('window')}${p('.')}${pr('__data__')} ${op('||')} ${p('{}')}${p(';')}`,
    `    ${nb('document')}${p('.')}${fn('getElementById')}${p('(')}${st("'event_name'")}${p(').')}${pr('textContent')}`,
    `      ${op('=')} ${id('d')}${p('.')}${pr('event_name')} ${op('||')} ${st("''")}${p(';')}`,
    `    ${nb('document')}${p('.')}${fn('getElementById')}${p('(')}${st("'datetime'")}${p(').')}${pr('textContent')}`,
    `      ${op('=')} ${p('(')}${id('d')}${p('.')}${pr('date')} ${op('||')} ${st("''")}${p(')')} ${op('+')} ${p('(')}${id('d')}${p('.')}${pr('time')} ${op('?')} ${st("' · '")} ${op('+')} ${id('d')}${p('.')}${pr('time')} ${op(':')} ${st("''")}${p(');')}`,
    `    ${nb('document')}${p('.')}${fn('getElementById')}${p('(')}${st("'location'")}${p(').')}${pr('textContent')}`,
    `      ${op('=')} ${id('d')}${p('.')}${pr('location')} ${op('||')} ${st("''")}${p(';')}`,
    `  ${p('</')}${tg('script')}${p('>')}`,
    `${p('</')}${tg('body')}${p('>')}`,
    `${p('</')}${tg('html')}${p('>')}`,
];

export default function CodeTemplatesSection() {
    return (
        <section className="bg-white w-[90%] lg:w-[80%] border-l border-r border-border-light p-6 lg:p-20 mx-auto">
            <div className="mx-auto grid md:grid-cols-[40%_60%] gap-12 items-center">
                <div className="lg:w-[90%]">
                    <h2 className="text-[16px] font-bold text-gray-900 mb-6">
                        Not afraid of a little code?
                    </h2>

                    <p className="text-sm text-gray-600 mb-8">
                        While everyone else is dragging, dropping, and publishing flyers in
                        minutes, developers can unlock an extra layer of customization with
                        HTML, CSS, and JavaScript templates.
                    </p>

                    <button className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition text-sm">
                        View Documentation
                    </button>
                </div>

                <div className="rounded-xl overflow-hidden shadow-xl">
                    {/* traffic lights */}
                    <div className="flex items-center gap-1.5 px-3.5 py-2.5" style={{ background: '#1a1a2a' }}>
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#ff5f57' }} />
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#febc2e' }} />
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#28c840' }} />
                    </div>

                    {/* tab */}
                    <div className="px-3 pt-1.5 border-b border-white/10" style={{ background: '#1e1e2e' }}>
                        <span className="inline-block text-[11px] px-3.5 py-1.5 rounded-t" style={{ background: '#252535', color: '#ccc', fontFamily: 'monospace' }}>
                            template.html
                        </span>
                    </div>

                    {/* code */}
                    <div className="flex overflow-x-auto" style={{ background: '#1e1e2e' }}>
                        {/* line numbers */}
                        <div className="select-none text-right py-4 pl-3 pr-2.5 shrink-0" style={{ fontFamily: 'monospace', fontSize: 12, lineHeight: 1.65, color: '#404060' }}>
                            {CODE_LINES.map((_, i) => <div key={i}>{i + 1}</div>)}
                        </div>

                        {/* highlighted lines */}
                        <pre style={{ margin: 0, padding: '16px 16px 16px 6px', fontFamily: 'monospace', fontSize: 12, lineHeight: 1.65, background: '#1e1e2e', flex: 1 }}>
                            <code dangerouslySetInnerHTML={{ __html: CODE_LINES.join('\n') }} />
                        </pre>
                    </div>
                </div>
            </div>
        </section>
    );
}