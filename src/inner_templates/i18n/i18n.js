window.i18n = (function () {
    let dictionary = {};
    let currentLang = 'en';

    async function loadLanguage(lang) {
        try {
            const response = await fetch(`../i18n/${lang}.json`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            dictionary = await response.json();
            currentLang = lang;
            return true;
        } catch (e) {
            console.warn(`Failed load ${lang}:`, e);
            dictionary = {};
            return false;
        }
    }

    function t(text) {
        if (dictionary && dictionary[text] !== undefined) {
            return dictionary[text];
        }
        return text;
    }

    function translateDOM(root = document.body) {
        const walker = document.createTreeWalker(
            root,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    const parent = node.parentElement;
                    if (!parent) return NodeFilter.FILTER_REJECT;
                    if (['SCRIPT', 'STYLE', 'CODE', 'PRE'].includes(parent.tagName)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    if (node.textContent.trim().length === 0) return NodeFilter.FILTER_REJECT;
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );
        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        for (let node of nodes) {
            const original = node.textContent;
            const translated = t(original);
            if (translated !== original) node.textContent = translated;
        }

        const attrs = ['placeholder', 'title', 'aria-label', 'value'];
        const allElements = root.querySelectorAll('*');
        for (let el of allElements) {
            for (let attr of attrs) {
                if (el.hasAttribute(attr)) {
                    const original = el.getAttribute(attr);
                    const translated = t(original);
                    if (translated !== original) el.setAttribute(attr, translated);
                }
            }
        }
    }

    async function init() {
        alert("i18n init start");  // 确认函数被调用
        let lang = new URLSearchParams(location.search).get('lang');
        if (!lang) lang = localStorage.getItem('app_lang');
        if (!lang) lang = navigator.language.split('-')[0];
        if (!lang) lang = 'en';
        alert("Detected language: " + lang);  // 看实际检测结果
        await loadLanguage(lang);
        alert("Dictionary keys: " + Object.keys(dictionary).length);  // 看是否加载成功
        translateDOM();
        localStorage.setItem('app_lang', currentLang);
        alert("Translation done");
    }

    return {
        init,
        t,
        loadLanguage,
        translateDOM,
        get currentLang() { return currentLang; }
    };
})();